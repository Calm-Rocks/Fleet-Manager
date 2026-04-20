// supabase/functions/dvla-lookup/index.ts
//
// Supabase Edge Function — DVLA Vehicle Enquiry Service (VES) proxy
//
// Deploy with:
//   supabase functions deploy dvla-lookup
//
// Requires these secrets to be set:
//   supabase secrets set DVLA_API_KEY=your_key_here
//
// Get your API key from:
//   https://developer-portal.driver-vehicle-licensing.api.gov.uk
//   Product: Vehicle Enquiry Service (VES)
//
// The frontend calls this function instead of the DVLA API directly
// so we never expose the API key to the browser.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DVLA_API_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { registration } = await req.json()

    if (!registration || typeof registration !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Registration number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalise: strip spaces, uppercase
    const reg = registration.replace(/\s+/g, '').toUpperCase()

    if (reg.length < 2 || reg.length > 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid registration number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('DVLA_API_KEY')
    if (!apiKey) {
      // In development without a real key, return mock data so you can test the UI flow
      console.warn('DVLA_API_KEY not set — returning mock data')
      return new Response(
        JSON.stringify({
          success: true,
          data: mockVehicleData(reg),
          _mock: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call the real DVLA VES API
    const dvlaRes = await fetch(DVLA_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationNumber: reg }),
    })

    if (dvlaRes.status === 404) {
      return new Response(
        JSON.stringify({ success: false, error: 'Vehicle not found. Check the registration and try again.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!dvlaRes.ok) {
      const errBody = await dvlaRes.text()
      console.error('DVLA API error:', dvlaRes.status, errBody)
      return new Response(
        JSON.stringify({ success: false, error: 'DVLA lookup failed. Please try again.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const dvlaData = await dvlaRes.json()

    // Map DVLA response shape to our own clean shape
    const result = {
      success: true,
      data: {
        registration:        dvlaData.registrationNumber,
        make:                titleCase(dvlaData.make || ''),
        colour:              titleCase(dvlaData.colour || ''),
        fuelType:            titleCase(dvlaData.fuelType || ''),
        yearOfManufacture:   dvlaData.yearOfManufacture,
        engineCapacity:      dvlaData.engineCapacity,
        co2Emissions:        dvlaData.co2Emissions,
        motExpiryDate:       dvlaData.motExpiryDate   || null,
        taxDueDate:          dvlaData.taxDueDate       || null,
        motStatus:           dvlaData.motStatus,
        taxStatus:           dvlaData.taxStatus,
      },
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function titleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

// Mock data used when DVLA_API_KEY is not set (development / testing)
function mockVehicleData(reg: string) {
  return {
    registration: reg,
    make: 'Ford',
    colour: 'White',
    fuelType: 'Diesel',
    yearOfManufacture: 2021,
    engineCapacity: 2000,
    co2Emissions: 165,
    motExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    taxDueDate:    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    motStatus: 'Valid',
    taxStatus: 'Taxed',
    _mock: true,
  }
}
