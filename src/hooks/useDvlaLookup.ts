import { useState } from 'react'
import { isDemoMode } from '../lib/supabase'
import type { DvlaLookupResult, DvlaVehicleData } from '../types'

const mockLookup = (reg: string): DvlaVehicleData => ({
  registration: reg.toUpperCase().replace(/\s+/g, ''),
  make: 'Ford',
  colour: 'White',
  fuelType: 'Diesel',
  yearOfManufacture: 2021,
  engineCapacity: 2000,
  motExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  taxDueDate:    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  motStatus: 'Valid',
  taxStatus: 'Taxed',
})

export function useDvlaLookup() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<DvlaLookupResult | null>(null)

  const lookup = async (registration: string): Promise<DvlaLookupResult> => {
    if (!registration.trim()) {
      return { success: false, error: 'Enter a registration number first' }
    }

    setLoading(true)
    setResult(null)

    try {
      let res: DvlaLookupResult

      if (isDemoMode) {
        console.log('[DVLA] Demo mode — returning mock data')
        await new Promise(r => setTimeout(r, 600))
        res = { success: true, data: mockLookup(registration) }
      } else {
        // Read env vars at call time — not at module load time
        const supabaseUrl  = (window as any).__supabaseUrl
          || import.meta.env.VITE_SUPABASE_URL
        const supabaseKey  = (window as any).__supabaseKey
          || import.meta.env.VITE_SUPABASE_ANON_KEY

        const url = `${supabaseUrl}/functions/v1/dvla-lookup`
        console.log('[DVLA] Fetching:', url)

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 15000)

        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type':  'application/json',
            'apikey':        supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ registration }),
        })

        clearTimeout(timer)
        console.log('[DVLA] Status:', response.status)

        if (!response.ok) {
          const text = await response.text()
          console.error('[DVLA] Error body:', text)
          res = { success: false, error: `Server error ${response.status}` }
        } else {
          const json = await response.json()
          console.log('[DVLA] Data:', json)
          res = json as DvlaLookupResult
        }
      }

      setResult(res)
      return res
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      console.error('[DVLA] Error:', err)
      const res: DvlaLookupResult = {
        success: false,
        error: isAbort
          ? 'Request timed out after 15 seconds'
          : 'Network error — please try again',
      }
      setResult(res)
      return res
    } finally {
      setLoading(false)
    }
  }

  const reset = () => setResult(null)

  return { lookup, loading, result, reset }
}
