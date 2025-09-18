import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GHL_API_KEY')?.trim();
    const locationId = Deno.env.get('GHL_LOCATION_ID')?.trim();

    console.log('Starting GHL diagnose...');
    console.log('- API Key present:', apiKey ? 'YES' : 'NO');
    console.log('- API Key prefix:', apiKey ? apiKey.slice(0, 15) + '...' : 'N/A');
    console.log('- API Key type:', apiKey && apiKey.startsWith('pit') ? 'Private Integration Token' : 'Other/Unknown');
    console.log('- API Key length:', apiKey ? apiKey.length : 0);
    console.log('- Location ID present:', locationId ? 'YES' : 'NO');
    console.log('- Location ID value:', locationId ? locationId.slice(0, 10) + '...' : 'N/A');

    if (!apiKey) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Missing GHL_API_KEY secret',
        hint: 'Add it in Supabase -> Edge Functions -> Secrets',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const baseHeaders: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const headersWithLocation: Record<string, string> = {
      ...baseHeaders,
      ...(locationId ? { 'Location-Id': locationId } : {}),
    };

    // Test both primary and fallback endpoints
    const primaryBase = 'https://services.leadconnectorhq.com';
    const fallbackBase = 'https://rest.gohighlevel.com';

    // Test 1: Primary endpoint - locations
    console.log('Testing PRIMARY: GET', primaryBase + '/v1/locations');
    const primaryLocationsRes = await fetch(primaryBase + '/v1/locations', {
      method: 'GET',
      headers: baseHeaders,
    });
    const primaryLocationsText = await primaryLocationsRes.text();
    console.log('Primary locations status:', primaryLocationsRes.status);
    console.log('Primary locations body (first 200 chars):', primaryLocationsText.substring(0, 200));

    // Test 2: Primary endpoint - contacts
    console.log('Testing PRIMARY: GET', primaryBase + '/v1/contacts?limit=1');
    const primaryContactsRes = await fetch(primaryBase + '/v1/contacts/?limit=1', {
      method: 'GET',
      headers: headersWithLocation,
    });
    const primaryContactsText = await primaryContactsRes.text();
    console.log('Primary contacts status:', primaryContactsRes.status);
    console.log('Primary contacts body (first 200 chars):', primaryContactsText.substring(0, 200));

    // Test 3: Fallback endpoint - locations
    console.log('Testing FALLBACK: GET', fallbackBase + '/v1/locations');
    const fallbackLocationsRes = await fetch(fallbackBase + '/v1/locations', {
      method: 'GET',
      headers: baseHeaders,
    });
    const fallbackLocationsText = await fallbackLocationsRes.text();
    console.log('Fallback locations status:', fallbackLocationsRes.status);
    console.log('Fallback locations body (first 200 chars):', fallbackLocationsText.substring(0, 200));

    // Test 4: Fallback endpoint - contacts
    console.log('Testing FALLBACK: GET', fallbackBase + '/v1/contacts?limit=1');
    const fallbackContactsRes = await fetch(fallbackBase + '/v1/contacts/?limit=1', {
      method: 'GET',
      headers: headersWithLocation,
    });
    const fallbackContactsText = await fallbackContactsRes.text();
    console.log('Fallback contacts status:', fallbackContactsRes.status);
    console.log('Fallback contacts body (first 200 chars):', fallbackContactsText.substring(0, 200));

    // Parse JSON responses
    let primaryLocationsJson: unknown = null;
    let primaryContactsJson: unknown = null;
    let fallbackLocationsJson: unknown = null;
    let fallbackContactsJson: unknown = null;

    try { primaryLocationsJson = JSON.parse(primaryLocationsText); } catch {}
    try { primaryContactsJson = JSON.parse(primaryContactsText); } catch {}
    try { fallbackLocationsJson = JSON.parse(fallbackLocationsText); } catch {}
    try { fallbackContactsJson = JSON.parse(fallbackContactsText); } catch {}

    // Build diagnosis
    let diagnosis = 'OK';
    let recommendedEndpoint = primaryBase;

    // Check primary endpoint first
    if (primaryLocationsRes.ok && primaryContactsRes.ok) {
      diagnosis = 'All tests passed on PRIMARY endpoint (services.leadconnectorhq.com)';
      recommendedEndpoint = primaryBase;
    } else if (fallbackLocationsRes.ok && fallbackContactsRes.ok) {
      diagnosis = 'Primary endpoint failed, but FALLBACK endpoint (rest.gohighlevel.com) works';
      recommendedEndpoint = fallbackBase;
    } else if (primaryLocationsRes.status === 401 || fallbackLocationsRes.status === 401) {
      diagnosis = 'Unauthorized with GHL API. Verify the token value, ensure it is a Private Integration Token (pit-...), and that it has required scopes.';
    } else if ((primaryContactsRes.status === 403 || fallbackContactsRes.status === 403) && !locationId) {
      diagnosis = 'Forbidden for contacts without Location-Id. Set GHL_LOCATION_ID secret for the target subaccount.';
    } else if (!primaryContactsRes.ok && !fallbackContactsRes.ok && locationId) {
      diagnosis = 'Contacts endpoint failed on BOTH endpoints even with Location-Id. Check that the Location-Id belongs to the token\'s account and that scopes include contacts:write/read.';
    } else {
      diagnosis = 'Both primary and fallback endpoints failed. Check API key validity and permissions.';
    }

    const anySuccess = primaryLocationsRes.ok || primaryContactsRes.ok || fallbackLocationsRes.ok || fallbackContactsRes.ok;

    return new Response(JSON.stringify({
      ok: anySuccess,
      diagnosis,
      recommendedEndpoint,
      apiKey_present: !!apiKey,
      apiKey_prefix: apiKey?.slice(0, 3),
      apiKey_length: apiKey?.length,
      location_id_present: !!locationId,
      tests: {
        primary_locations: { 
          url: primaryBase + '/v1/locations',
          status: primaryLocationsRes.status, 
          ok: primaryLocationsRes.ok, 
          body: primaryLocationsJson ?? primaryLocationsText.substring(0, 300) 
        },
        primary_contacts: { 
          url: primaryBase + '/v1/contacts',
          status: primaryContactsRes.status, 
          ok: primaryContactsRes.ok, 
          body: primaryContactsJson ?? primaryContactsText.substring(0, 300) 
        },
        fallback_locations: { 
          url: fallbackBase + '/v1/locations',
          status: fallbackLocationsRes.status, 
          ok: fallbackLocationsRes.ok, 
          body: fallbackLocationsJson ?? fallbackLocationsText.substring(0, 300) 
        },
        fallback_contacts: { 
          url: fallbackBase + '/v1/contacts',
          status: fallbackContactsRes.status, 
          ok: fallbackContactsRes.ok, 
          body: fallbackContactsJson ?? fallbackContactsText.substring(0, 300) 
        },
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in ghl-diagnose:', error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});