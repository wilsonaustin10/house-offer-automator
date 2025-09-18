import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Helper to ensure background tasks run and logs are captured
function schedule(task: Promise<any>) {
  try {
    // @ts-ignore - EdgeRuntime is available in Supabase edge runtime
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(task);
      console.log('Background task scheduled with EdgeRuntime.waitUntil');
      return;
    }
  } catch (_) {}
  // Fallback: fire-and-forget with error capture
  task.catch((e) => console.error('Background task error:', e));
}

interface LeadData {
  address: string;
  phone: string;
  smsConsent: boolean;
  isListed: string;
  condition: string;
  timeline: string;
  askingPrice: string;
  firstName: string;
  lastName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Starting lead submission process...');
    
    const leadData: LeadData = await req.json();
    console.log('Received lead data:', { ...leadData, phone: '***', email: '***' });
    
    // Initialize Supabase client with service role key for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate required fields
    if (!leadData.address || !leadData.phone || !leadData.firstName || !leadData.lastName || !leadData.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store lead in database
    console.log('Storing lead in database...');
    const { data: lead, error: dbError } = await supabase
      .from('leads')
      .insert({
        address: leadData.address,
        phone: leadData.phone,
        sms_consent: leadData.smsConsent,
        is_listed: leadData.isListed,
        condition: leadData.condition,
        timeline: leadData.timeline,
        asking_price: leadData.askingPrice,
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        email: leadData.email,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to store lead data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Lead stored successfully with ID:', lead.id);

    // Prepare lead data for external APIs
    const leadPayload = {
      lead_id: lead.id,
      timestamp: new Date().toISOString(),
      property: {
        address: leadData.address,
        condition: leadData.condition,
        timeline: leadData.timeline,
        asking_price: leadData.askingPrice,
        is_listed: leadData.isListed === 'yes'
      },
      contact: {
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        full_name: `${leadData.firstName} ${leadData.lastName}`,
        email: leadData.email,
        phone: leadData.phone,
        sms_consent: leadData.smsConsent
      },
      source: 'website_form'
    };

    // Handle Zapier webhook and Go High Level API in background
    // Send to Zapier webhook if configured
    const zapierWebhookUrl = Deno.env.get('ZAPIER_WEBHOOK_URL');
    if (zapierWebhookUrl && zapierWebhookUrl.trim() !== '') {
      console.log('Sending to Zapier webhook...');
      schedule(sendToZapier(zapierWebhookUrl, leadPayload, supabase, lead.id));
    } else {
      console.log('Zapier webhook URL not configured, skipping...');
    }

    // Send to Go High Level API if configured
    const ghlApiKey = Deno.env.get('GHL_API_KEY')?.trim();
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID')?.trim();
    
    console.log('=== GHL SECRET VALUES CHECK ===');
    console.log('- API Key configured:', ghlApiKey ? 'YES' : 'NO');
    console.log('- API Key FULL VALUE (for debugging):', ghlApiKey ? `"${ghlApiKey}"` : 'N/A');
    console.log('- API Key prefix:', ghlApiKey ? ghlApiKey.slice(0, 15) + '...' : 'N/A');
    console.log('- API Key type:', ghlApiKey && ghlApiKey.startsWith('pit') ? 'Private Integration Token' : 'Other/Unknown');
    console.log('- API Key length:', ghlApiKey ? ghlApiKey.length : 0);
    console.log('- Location ID configured:', ghlLocationId ? 'YES' : 'NO');
    console.log('- Location ID FULL VALUE (for debugging):', ghlLocationId ? `"${ghlLocationId}"` : 'N/A');
    console.log('- Location ID first 8 chars:', ghlLocationId ? ghlLocationId.slice(0, 8) + '...' : 'N/A');
    
    // Validate Location ID format
    if (ghlLocationId && ghlLocationId.startsWith('pit')) {
      console.log('⚠️  WARNING: GHL_LOCATION_ID looks like a PIT token, not a Location ID!');
      console.log('⚠️  This will cause 403 errors. Please set GHL_LOCATION_ID to your actual Sub-Account (Location) ID.');
    }
    
    // Test GHL configuration and send to API
    if (ghlApiKey && ghlApiKey.trim() !== '') {
      console.log('✅ Go High Level API configured, scheduling background task...');
      schedule(async () => {
        // Always run diagnosis first for logging
        const diagnosis = await testGhlConfiguration(ghlApiKey, ghlLocationId, supabase, lead.id);
        
        console.log('🔍 DIAGNOSIS RESULT:', JSON.stringify(diagnosis, null, 2));
        
        // Enhanced decision logic - be more permissive but log everything
        let shouldProceed = false;
        let skipReason = '';
        
        if (!diagnosis) {
          console.log('🟡 No diagnosis available - proceeding with API call anyway');
          shouldProceed = true;
        } else if (diagnosis.location_id_looks_like_pit) {
          console.log('🔴 Location ID appears to be PIT token - this will likely fail');
          skipReason = 'Location ID is a PIT token instead of Sub-Account ID';
          shouldProceed = false;
        } else if (diagnosis.ok) {
          console.log('🟢 Diagnosis OK - proceeding with API call');
          shouldProceed = true;
        } else if (diagnosis.diagnosis?.includes('403') || diagnosis.diagnosis?.includes('Forbidden')) {
          console.log('🟠 Diagnosis shows 403 errors - attempting anyway for testing');
          shouldProceed = true; // Try anyway to capture the exact error
        } else {
          console.log('🟡 Uncertain diagnosis - proceeding with API call to test');
          shouldProceed = true;
        }
        
        if (shouldProceed) {
          console.log('▶️  PROCEEDING WITH GHL API CALL');
          await sendToGoHighLevel(ghlApiKey, leadPayload, supabase, lead.id);
        } else {
          console.log('⏸️  SKIPPING GHL API CALL:', skipReason);
          // Update lead record with skip reason
          await supabase
            .from('leads')
            .update({
              ghl_sent: false,
              ghl_error: `SKIPPED: ${skipReason}`,
              ghl_sent_at: new Date().toISOString()
            })
            .eq('id', lead.id);
        }
      });
    } else {
      console.log('❌ Go High Level API key not configured, skipping...');
    }



    return new Response(JSON.stringify({
      success: true,
      message: 'Lead submitted successfully',
      lead_id: lead.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-lead function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

async function sendToZapier(webhookUrl: string, leadPayload: any, supabase: any, leadId: string) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadPayload),
    });

    if (response.ok) {
      console.log('Successfully sent lead to Zapier');
      await supabase
        .from('leads')
        .update({
          zapier_sent: true,
          zapier_sent_at: new Date().toISOString()
        })
        .eq('id', leadId);
    } else {
      console.error('Failed to send to Zapier:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Error sending to Zapier:', error);
  }
}

async function sendToGoHighLevel(apiKey: string, leadPayload: any, supabase: any, leadId: string) {
  try {
    console.log('=== GHL API V2 Call Debug Info ===');
    console.log('API Key type:', apiKey.startsWith('pit') ? 'Private Integration Token' : 'Other');
    console.log('API Key (first 15 chars):', apiKey ? apiKey.substring(0, 15) + '...' : 'NOT SET');
    
    // Go High Level API V2 Contact creation (for Private Integration Tokens)
    const ghlPayload = {
      firstName: leadPayload.contact.first_name,
      lastName: leadPayload.contact.last_name,
      email: leadPayload.contact.email,
      phone: leadPayload.contact.phone,
      address1: leadPayload.property.address,
      tags: ['website-lead', 'cash-buyer'],
      customFields: [
        { key: 'property_condition', value: leadPayload.property.condition },
        { key: 'timeline', value: leadPayload.property.timeline },
        { key: 'asking_price', value: leadPayload.property.asking_price },
        { key: 'is_listed', value: leadPayload.property.is_listed ? 'Yes' : 'No' },
        { key: 'sms_consent', value: leadPayload.contact.sms_consent ? 'Yes' : 'No' },
        { key: 'lead_source', value: leadPayload.source }
      ]
    };

    console.log('GHL V2 Payload:', JSON.stringify(ghlPayload, null, 2));

    // Prepare headers for GHL V2
    const ghlHeaders: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Version': '2021-07-28',
    };

    const locationId = Deno.env.get('GHL_LOCATION_ID')?.trim();
    console.log('Using Location-Id header:', locationId ? 'YES' : 'NO');
    console.log('Location-Id first 8 chars:', locationId ? locationId.slice(0, 8) + '...' : 'N/A');
    
    // Validate Location ID format before using it
    if (locationId && locationId.startsWith('pit')) {
      console.log('⚠️  CRITICAL: Location ID is a PIT token, not a Location ID! This will fail.');
      // Update lead with validation error and skip API call
      await supabase
        .from('leads')
        .update({
          ghl_sent: false,
          ghl_error: 'VALIDATION ERROR: GHL_LOCATION_ID appears to be a PIT token instead of a Location ID',
          ghl_sent_at: new Date().toISOString()
        })
        .eq('id', leadId);
      return;
    }
    
    if (locationId) {
      ghlHeaders['Location-Id'] = locationId;
    }

    // LeadConnector API (PIT) uses services.leadconnectorhq.com without /v1
    const primaryUrl = 'https://services.leadconnectorhq.com/contacts/';

    console.log('Making request to:', primaryUrl);
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers: ghlHeaders,
      body: JSON.stringify(ghlPayload),
    });

    const usedEndpoint = 'services.leadconnectorhq.com';

    console.log('GHL V2 Response Status:', response.status);
    console.log('GHL V2 Endpoint Used:', usedEndpoint);
    console.log('GHL V2 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('GHL V2 Response Body (first 300 chars):', responseText.substring(0, 300));

    if (response.ok) {
      console.log('✅ Successfully sent lead to Go High Level V2 API');
      
      // Try to parse response as JSON to get contact ID
      try {
        const responseData = JSON.parse(responseText);
        console.log('Created GHL V2 Contact ID:', responseData.contact?.id || 'ID not found');
      } catch (parseError) {
        console.log('Response was not JSON:', parseError.message);
      }

      await supabase
        .from('leads')
        .update({
          ghl_sent: true,
          ghl_sent_at: new Date().toISOString(),
          ghl_response: `Success via ${usedEndpoint}: ${responseText.substring(0, 500)}`
        })
        .eq('id', leadId);
    } else {
      console.error('❌ Failed to send to Go High Level V2 API');
      console.error('Status:', response.status);
      console.error('Endpoint:', usedEndpoint);
      console.error('Response:', responseText);
      
      // Store error info in database
      await supabase
        .from('leads')
        .update({
          ghl_sent: false,
          ghl_error: `${usedEndpoint} - Status: ${response.status}, Error: ${responseText}`,
          ghl_sent_at: new Date().toISOString()
        })
        .eq('id', leadId);
    }
  } catch (error) {
    console.error('❌ Exception in sendToGoHighLevel V2:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Store error info in database
    try {
      await supabase
        .from('leads')
        .update({
          ghl_sent: false,
          ghl_error: `Exception: ${error.message}`,
          ghl_sent_at: new Date().toISOString()
        })
        .eq('id', leadId);
    } catch (dbError) {
      console.error('Failed to update database with error:', dbError);
    }
  }
}

async function testGhlConfiguration(apiKey: string, locationId: string | undefined, supabase: any, leadId: string) {
  try {
    console.log('🔍 Testing GHL configuration with ghl-diagnose function...');
    
    // Call the ghl-diagnose function to validate the current configuration
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ghl-diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
    });

    const result = await response.text();
    console.log('🔍 GHL Diagnose Response Status:', response.status);
    console.log('🔍 GHL Diagnose Response:', result);

    // Try to parse and log the diagnosis
    try {
      const diagnosis = JSON.parse(result);
      console.log('🔍 GHL Diagnosis Summary:', diagnosis.diagnosis || 'No diagnosis available');
      console.log('🔍 API Key Status:', diagnosis.apiKey_present ? 'Present' : 'Missing');
      console.log('🔍 API Key Prefix from Diagnose:', diagnosis.apiKey_prefix || 'N/A');
      console.log('🔍 Location ID Looks Like PIT:', diagnosis.location_id_looks_like_pit ? 'YES' : 'NO');
      console.log('🔍 Location ID First 8 Chars:', diagnosis.location_id_first8 || 'N/A');
      
      // Check if diagnose indicates a serious configuration issue
      let diagnosisPrefix = 'Diagnosis: ';
      if (diagnosis.location_id_looks_like_pit) {
        diagnosisPrefix = 'CRITICAL CONFIG ERROR: ';
      } else if (diagnosis.diagnosis?.includes('403') || diagnosis.diagnosis?.includes('Forbidden')) {
        diagnosisPrefix = 'ACCESS ERROR: ';
      }
      
      // Update the lead record with diagnosis info
      await supabase
        .from('leads')
        .update({
          ghl_response: `${diagnosisPrefix}${diagnosis.diagnosis || 'No diagnosis'}`,
        })
        .eq('id', leadId);
        
      // Return diagnosis info for use by sendToGoHighLevel
      return diagnosis;
    } catch (parseError) {
      console.log('🔍 Could not parse diagnosis response as JSON');
      return null;
    }
  } catch (error) {
    console.error('🔍 Error testing GHL configuration:', error);
    return null;
  }
}

serve(handler);