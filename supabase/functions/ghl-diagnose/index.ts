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
    console.log('- API Key type:', apiKey && apiKey.startsWith('pit') ? 'Private Integration Token' : 'Other/Unknown');
    console.log('- Location ID present:', locationId ? 'YES' : 'NO');

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

    // Test 1: Token validity by fetching locations
    console.log('Testing: GET /v1/locations');
    const locationsRes = await fetch('https://rest.gohighlevel.com/v1/locations', {
      method: 'GET',
      headers: baseHeaders,
    });
    const locationsText = await locationsRes.text();
    console.log('Locations status:', locationsRes.status);
    console.log('Locations body:', locationsText);

    let locationsJson: unknown = null;
    try { locationsJson = JSON.parse(locationsText); } catch {}

    // Test 2: Fetch one contact (requires location when applicable)
    console.log('Testing: GET /v1/contacts?limit=1');
    const contactsRes = await fetch('https://rest.gohighlevel.com/v1/contacts/?limit=1', {
      method: 'GET',
      headers: headersWithLocation,
    });
    const contactsText = await contactsRes.text();
    console.log('Contacts status:', contactsRes.status);
    console.log('Contacts body:', contactsText);

    let contactsJson: unknown = null;
    try { contactsJson = JSON.parse(contactsText); } catch {}

    // Build a quick diagnosis message
    let diagnosis = 'OK';
    if (locationsRes.status === 401 || contactsRes.status === 401) {
      diagnosis = 'Unauthorized with GHL API. Verify the token value, ensure it is a Private Integration Token (pit-...), and that it has required scopes.';
    } else if (contactsRes.status === 403 && !locationId) {
      diagnosis = 'Forbidden for contacts without Location-Id. Set GHL_LOCATION_ID secret for the target subaccount.';
    } else if (!contactsRes.ok && locationId) {
      diagnosis = 'Contacts endpoint failed even with Location-Id. Check that the Location-Id belongs to the token’s account and that scopes include contacts:write/read.';
    }

    return new Response(JSON.stringify({
      ok: locationsRes.ok && contactsRes.ok,
      diagnosis,
      apiKey_present: !!apiKey,
      apiKey_prefix: apiKey?.slice(0, 3),
      location_id_present: !!locationId,
      tests: {
        locations: { status: locationsRes.status, ok: locationsRes.ok, body: locationsJson ?? locationsText },
        contacts: { status: contactsRes.status, ok: contactsRes.ok, body: contactsJson ?? contactsText },
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