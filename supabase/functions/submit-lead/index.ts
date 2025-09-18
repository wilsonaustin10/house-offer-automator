import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    console.log('GHL Configuration Check:');
    console.log('- API Key configured:', ghlApiKey ? 'YES' : 'NO');
    console.log('- API Key prefix:', ghlApiKey ? ghlApiKey.slice(0, 15) + '...' : 'N/A');
    console.log('- API Key type:', ghlApiKey && ghlApiKey.startsWith('pit') ? 'Private Integration Token' : 'Other/Unknown');
    console.log('- API Key length:', ghlApiKey ? ghlApiKey.length : 0);
    console.log('- Location ID configured:', ghlLocationId ? 'YES' : 'NO');
    console.log('- Location ID value:', ghlLocationId ? ghlLocationId.slice(0, 10) + '...' : 'N/A');
    
    // Test GHL configuration first
    if (ghlApiKey && ghlApiKey.trim() !== '') {
      console.log('✅ Go High Level API configured, scheduling background task...');
      // First test the configuration with ghl-diagnose
      schedule(testGhlConfiguration(ghlApiKey, ghlLocationId, supabase, lead.id));
      schedule(sendToGoHighLevel(ghlApiKey, leadPayload, supabase, lead.id));
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
    console.log('API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
    
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
    console.log('Making request to: https://rest.gohighlevel.com/v1/contacts/');

    // Prepare headers for GHL V2
    const ghlHeaders: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Version': '2021-07-28',
    };

    const locationId = Deno.env.get('GHL_LOCATION_ID')?.trim();
    console.log('Using Location-Id header:', locationId ? 'YES' : 'NO');
    if (locationId) {
      ghlHeaders['Location-Id'] = locationId;
    }

    const response = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
      method: 'POST',
      headers: ghlHeaders,
      body: JSON.stringify(ghlPayload),
    });

    console.log('GHL V2 Response Status:', response.status);
    console.log('GHL V2 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('GHL V2 Response Body:', responseText);

    if (response.ok) {
      console.log('✅ Successfully sent lead to Go High Level V2 API');
      
      // Try to parse response as JSON to get contact ID
      try {
        const responseData = JSON.parse(responseText);
        console.log('Created GHL V2 Contact:', responseData);
      } catch (parseError) {
        console.log('Response was not JSON:', parseError);
      }

      await supabase
        .from('leads')
        .update({
          ghl_sent: true,
          ghl_sent_at: new Date().toISOString(),
          ghl_response: responseText
        })
        .eq('id', leadId);
    } else {
      console.error('❌ Failed to send to Go High Level V2 API');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
      
      // Store error info in database
      await supabase
        .from('leads')
        .update({
          ghl_sent: false,
          ghl_error: `Status: ${response.status}, Error: ${responseText}`,
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
      
      // Update the lead record with diagnosis info
      await supabase
        .from('leads')
        .update({
          ghl_response: `Diagnosis: ${diagnosis.diagnosis || 'No diagnosis'}`,
        })
        .eq('id', leadId);
    } catch (parseError) {
      console.log('🔍 Could not parse diagnosis response as JSON');
    }
  } catch (error) {
    console.error('🔍 Error testing GHL configuration:', error);
  }
}

serve(handler);