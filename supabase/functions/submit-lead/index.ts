import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Simple background task handler with immediate error logging
async function runBackgroundTask(task: () => Promise<void>, taskName: string) {
  try {
    await task();
    console.log(`✅ ${taskName} completed successfully`);
  } catch (error) {
    console.error(`❌ ${taskName} failed:`, error);
  }
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

    // Send to Zapier webhook if configured
    const zapierWebhookUrl = Deno.env.get('ZAPIER_WEBHOOK_URL');
    if (zapierWebhookUrl && zapierWebhookUrl.trim() !== '') {
      console.log('Sending to Zapier webhook...');
      runBackgroundTask(async () => {
        await sendToZapier(zapierWebhookUrl, leadPayload, supabase, lead.id);
      }, 'Zapier Integration');
    } else {
      console.log('Zapier webhook URL not configured, skipping...');
    }

    // Send to Go High Level API if configured
    const ghlApiKey = Deno.env.get('GHL_API_KEY')?.trim();
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID')?.trim();

    const isJwtLike = !!ghlApiKey && /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(ghlApiKey);
    const isPit = !!ghlApiKey && ghlApiKey.startsWith('pit-');
    
    console.log('🔍 GHL Configuration Check:', {
      hasApiKey: !!ghlApiKey,
      hasLocationId: !!ghlLocationId,
      apiKeyLength: ghlApiKey ? ghlApiKey.length : 0,
      apiKeyPrefix: ghlApiKey ? ghlApiKey.substring(0, 4) : 'none',
      locationIdLength: ghlLocationId ? ghlLocationId.length : 0,
      locationIdPrefix: ghlLocationId ? ghlLocationId.substring(0, 8) : 'none',
      tokenType: isPit ? 'PIT' : (isJwtLike ? 'JWT' : 'unknown')
    });
    
    if (ghlApiKey) {
      // Run GHL integration as background task with adaptive token handling
      runBackgroundTask(async () => {
        console.log('🚀 Starting GHL integration for lead:', lead.id);

        if (isPit) {
          // PIT requires a Location-Id and must not look like a PIT
          if (!ghlLocationId) {
            const errorMsg = 'Missing GHL_LOCATION_ID for PIT token';
            console.log('❌ Validation failed:', errorMsg);
            await supabase
              .from('leads')
              .update({ ghl_sent: false, ghl_error: errorMsg, ghl_sent_at: new Date().toISOString() })
              .eq('id', lead.id);
            return;
          }
          if (ghlLocationId.startsWith('pit-')) {
            const errorMsg = 'Location ID appears to be a PIT token instead of a Sub-Account ID';
            console.log('❌ Validation failed:', errorMsg);
            await supabase
              .from('leads')
              .update({ ghl_sent: false, ghl_error: errorMsg, ghl_sent_at: new Date().toISOString() })
              .eq('id', lead.id);
            return;
          }
          await sendToGoHighLevel(ghlApiKey, ghlLocationId, leadPayload, supabase, lead.id);
          return;
        }

        if (isJwtLike) {
          // JWT can work without Location-Id (embedded), pass if available
          await sendToGoHighLevel(ghlApiKey, ghlLocationId || '', leadPayload, supabase, lead.id);
          return;
        }

        const errorMsg = 'Unsupported GHL token type. Provide a PIT (starts with "pit-") or a JWT style Location API key.';
        console.log('❌ Validation failed:', errorMsg);
        await supabase
          .from('leads')
          .update({ ghl_sent: false, ghl_error: errorMsg, ghl_sent_at: new Date().toISOString() })
          .eq('id', lead.id);
      }, 'GHL Integration');
    } else {
      console.log('❌ GHL configuration incomplete - missing: GHL_API_KEY');
      await supabase
        .from('leads')
        .update({ 
          ghl_sent: false, 
          ghl_error: 'Configuration Error: Missing GHL_API_KEY',
          ghl_sent_at: new Date().toISOString()
        })
        .eq('id', lead.id);
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

async function sendToGoHighLevel(apiKey: string, locationId: string, leadPayload: any, supabase: any, leadId: string) {
  try {
    console.log('🔗 Starting GHL API call for lead:', leadId);

    const isPit = apiKey.startsWith('pit-');
    const isJwt = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(apiKey);

    console.log('🔍 Token type detection:', { isPit, isJwt, locationIdProvided: !!locationId });

    if (!isPit && !isJwt) {
      throw new Error('Unsupported token type. Provide a PIT (starts with "pit-") or a JWT style Location API key.');
    }

    // Resolve locationId for request body
    let bodyLocationId = (locationId || '').trim();
    if (!bodyLocationId && isJwt) {
      try {
        const parts = apiKey.split('.');
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = JSON.parse(atob(base64));
        bodyLocationId = json.location_id || json.locationId || '';
        console.log('🧩 Extracted locationId from JWT:', bodyLocationId ? bodyLocationId.substring(0, 8) + '...' : '(none)');
      } catch (e) {
        console.log('⚠️ Could not decode JWT to extract locationId');
      }
    }

    if (isPit && !bodyLocationId) {
      throw new Error('PIT token requires GHL_LOCATION_ID to be set.');
    }
    if (isPit && bodyLocationId.startsWith('pit-')) {
      throw new Error('GHL_LOCATION_ID appears to be a PIT token, not a Location ID.');
    }

    // Build minimal valid payload per docs (locationId required)
    const ghlPayload: Record<string, any> = {
      locationId: bodyLocationId,
      firstName: leadPayload.contact.first_name,
      lastName: leadPayload.contact.last_name,
      email: leadPayload.contact.email,
      phone: leadPayload.contact.phone,
      address1: leadPayload.property.address,
      tags: ['website-lead', 'cash-buyer'],
      source: leadPayload.source || 'public api'
    };

    console.log('📤 Payload for GHL:', JSON.stringify(ghlPayload, null, 2));

    // Prepare headers & endpoint per docs
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Version: '2021-07-28',
    };
    if (isPit) {
      headers['Location-Id'] = bodyLocationId;
    }

    const apiUrl = 'https://services.leadconnectorhq.com/contacts/';

    console.log('🏢 Using Location-Id header:', headers['Location-Id'] || '(none)');
    console.log('🏷️ Body locationId:', bodyLocationId || '(none)');
    console.log('🔑 Using API Key prefix:', apiKey.substring(0, 8) + '...');
    console.log('🌐 Making request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(ghlPayload),
    });

    const responseText = await response.text();
    console.log('📥 GHL Response Status:', response.status);
    console.log('📥 GHL Response Headers:', JSON.stringify([...response.headers.entries()]));
    console.log('📥 GHL Response Body:', responseText.substring(0, 1000));

    if (response.ok) {
      console.log('✅ Successfully sent lead to Go High Level');

      let contactId = 'unknown';
      try {
        const responseData = JSON.parse(responseText);
        contactId = responseData.contact?.id || responseData.id || 'unknown';
        console.log('👤 Created GHL Contact ID:', contactId);
      } catch (_) {
        console.log('⚠️ Could not parse GHL response as JSON');
      }

      await supabase
        .from('leads')
        .update({
          ghl_sent: true,
          ghl_sent_at: new Date().toISOString(),
          ghl_response: `Success - Contact ID: ${contactId} - ${responseText.substring(0, 300)}`
        })
        .eq('id', leadId);
    } else {
      const errorDetails = `Status: ${response.status}, Body: ${responseText.substring(0, 1000)}`;
      console.error('❌ Failed to send to Go High Level -', errorDetails);

      await supabase
        .from('leads')
        .update({
          ghl_sent: false,
          ghl_error: `API Error - ${errorDetails}`,
          ghl_sent_at: new Date().toISOString()
        })
        .eq('id', leadId);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('💥 Exception in GHL API call:', msg);

    try {
      await supabase
        .from('leads')
        .update({
          ghl_sent: false,
          ghl_error: `Exception: ${msg}`,
          ghl_sent_at: new Date().toISOString()
        })
        .eq('id', leadId);
    } catch (dbError) {
      console.error('Failed to update database with error:', dbError);
    }
  }
}

serve(handler);