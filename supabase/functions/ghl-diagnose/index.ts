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

    console.log('=== GHL DIAGNOSE - SECRET VALUES CHECK ===');
    console.log('- API Key present:', apiKey ? 'YES' : 'NO');
    console.log('- API Key FULL VALUE (for debugging):', apiKey ? `"${apiKey}"` : 'N/A');
    console.log('- API Key prefix:', apiKey ? apiKey.slice(0, 15) + '...' : 'N/A');
    console.log('- API Key type:', apiKey && apiKey.startsWith('pit') ? 'Private Integration Token' : 'Other/Unknown');
    console.log('- API Key length:', apiKey ? apiKey.length : 0);
    console.log('- Location ID present:', locationId ? 'YES' : 'NO');
    console.log('- Location ID FULL VALUE (for debugging):', locationId ? `"${locationId}"` : 'N/A');
    console.log('- Location ID value:', locationId ? locationId.slice(0, 8) + '...' : 'N/A');
    console.log('- Location ID header will be included:', locationId ? 'YES' : 'NO');
    if (locationId && locationId.startsWith('pit')) {
      console.log('⚠️  WARNING: Location ID looks like a PIT token, not a Location ID');
      console.log('⚠️  Expected format: alphanumeric string (e.g., "GbOoP9eUwGI1Eb30Baex")');
      console.log('⚠️  Current value starts with "pit-" which indicates API Key, not Location ID');
    }

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

    // Test services.leadconnectorhq.com with and without /v1 to detect correct base
    const primaryBase = 'https://services.leadconnectorhq.com';

    console.log('Testing (NO /v1): GET', primaryBase + '/contacts/?limit=1');
    console.log('Headers include Location-Id:', !!locationId, locationId ? `(${locationId.slice(0, 8)}...)` : '');
    const contactsNoV1Res = await fetch(primaryBase + '/contacts/?limit=1', {
      method: 'GET',
      headers: headersWithLocation,
    });
    const contactsNoV1Text = await contactsNoV1Res.text();
    console.log('Contacts (no /v1) status:', contactsNoV1Res.status);
    console.log('Contacts (no /v1) body (first 300 chars):', contactsNoV1Text.substring(0, 300));

    console.log('Testing (/v1): GET', primaryBase + '/v1/contacts/?limit=1');
    const contactsV1Res = await fetch(primaryBase + '/v1/contacts/?limit=1', {
      method: 'GET',
      headers: headersWithLocation,
    });
    const contactsV1Text = await contactsV1Res.text();
    console.log('Contacts (/v1) status:', contactsV1Res.status);
    console.log('Contacts (/v1) body (first 300 chars):', contactsV1Text.substring(0, 300));

    // Test additional endpoints for better diagnostics
    console.log('Testing GET /locations (list locations)');
    const locationsRes = await fetch(primaryBase + '/locations/', {
      method: 'GET',
      headers: baseHeaders, // Don't include Location-Id for listing locations
    });
    const locationsText = await locationsRes.text();
    console.log('Locations status:', locationsRes.status);
    console.log('Locations body (first 300 chars):', locationsText.substring(0, 300));

    // Test specific location details if Location ID is provided
    let locationDetailsRes = null;
    let locationDetailsText = '';
    if (locationId) {
      console.log(`Testing GET /locations/${locationId} (location details)`);
      locationDetailsRes = await fetch(primaryBase + `/locations/${locationId}`, {
        method: 'GET',
        headers: baseHeaders,
      });
      locationDetailsText = await locationDetailsRes.text();
      console.log('Location details status:', locationDetailsRes.status);
      console.log('Location details body (first 300 chars):', locationDetailsText.substring(0, 300));
    }

    // Test token principal (who am I?)
    console.log('Testing GET /users/me (token principal)');
    const usersMeRes = await fetch(primaryBase + '/users/me', {
      method: 'GET',
      headers: baseHeaders,
    });
    const usersMeText = await usersMeRes.text();
    console.log('Users/me status:', usersMeRes.status);
    console.log('Users/me body (first 300 chars):', usersMeText.substring(0, 300));

    // Build enhanced diagnosis
    let diagnosis = 'OK';
    let recommendedEndpoint = primaryBase + '/contacts';

    // Check for obvious Location ID format issues
    if (locationId && locationId.startsWith('pit')) {
      diagnosis = 'CRITICAL: Location ID appears to be a PIT token, not a Location ID. Please set GHL_LOCATION_ID to your actual Sub-Account (Location) ID.';
    } else if (contactsNoV1Res.ok) {
      diagnosis = 'Contacts endpoint works WITHOUT /v1 (use services.leadconnectorhq.com/contacts)';
      recommendedEndpoint = primaryBase + '/contacts';
    } else if (contactsV1Res.ok) {
      diagnosis = 'Contacts endpoint only works WITH /v1. For PIT-based tokens, prefer /contacts. Verify your token type and scopes.';
      recommendedEndpoint = primaryBase + '/contacts';
    } else if (contactsNoV1Res.status === 401 || contactsV1Res.status === 401) {
      diagnosis = 'Unauthorized. Verify the API key (PIT pit-...) and required scopes (contacts.write).';
    } else if ((contactsNoV1Res.status === 403 || contactsV1Res.status === 403) && !locationId) {
      diagnosis = 'Forbidden. Missing Location-Id. Set the GHL_LOCATION_ID secret to your Sub-Account (Location) ID.';
    } else if ((contactsNoV1Res.status === 403 || contactsV1Res.status === 403) && locationId) {
      if (locationsRes && locationsRes.ok) {
        diagnosis = 'Token works for /locations but 403 for /contacts with Location-Id. Verify: 1) Location ID is correct, 2) PIT has contacts.write scope, 3) PIT has access to this location.';
      } else {
        diagnosis = 'Forbidden for both /contacts and /locations. Verify API key validity and scopes (contacts.write, locations.read).';
      }
    } else if (contactsNoV1Res.status === 404 && contactsV1Res.status === 404) {
      diagnosis = 'Both /contacts and /v1/contacts return 404. Likely incorrect base path or missing headers (Version, Location-Id).';
    } else {
      diagnosis = 'Contacts endpoint failed. Check API key, Location-Id, and headers.';
    }

    const anySuccess = contactsNoV1Res.ok || contactsV1Res.ok;

    return new Response(JSON.stringify({
      ok: anySuccess,
      diagnosis,
      recommendedEndpoint,
      apiKey_present: !!apiKey,
      apiKey_prefix: apiKey?.slice(0, 3),
      apiKey_length: apiKey?.length,
      location_id_present: !!locationId,
      location_id_first8: locationId?.slice(0, 8),
      location_id_looks_like_pit: locationId?.startsWith('pit') || false,
      tests: {
        contacts_no_v1: {
          url: primaryBase + '/contacts/?limit=1',
          status: contactsNoV1Res.status,
          ok: contactsNoV1Res.ok,
          headers_included_location_id: !!locationId,
          body: (() => { try { return JSON.parse(contactsNoV1Text); } catch { return contactsNoV1Text.substring(0, 300); } })()
        },
        contacts_v1: {
          url: primaryBase + '/v1/contacts/?limit=1',
          status: contactsV1Res.status,
          ok: contactsV1Res.ok,
          headers_included_location_id: !!locationId,
          body: (() => { try { return JSON.parse(contactsV1Text); } catch { return contactsV1Text.substring(0, 300); } })()
        },
        locations_list: {
          url: primaryBase + '/locations/',
          status: locationsRes.status,
          ok: locationsRes.ok,
          body: (() => { try { return JSON.parse(locationsText); } catch { return locationsText.substring(0, 300); } })()
        },
        location_details: locationDetailsRes ? {
          url: primaryBase + `/locations/${locationId}`,
          status: locationDetailsRes.status,
          ok: locationDetailsRes.ok,
          body: (() => { try { return JSON.parse(locationDetailsText); } catch { return locationDetailsText.substring(0, 300); } })()
        } : null,
        users_me: {
          url: primaryBase + '/users/me',
          status: usersMeRes.status,
          ok: usersMeRes.ok,
          body: (() => { try { return JSON.parse(usersMeText); } catch { return usersMeText.substring(0, 300); } })()
        }
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