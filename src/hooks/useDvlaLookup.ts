import { useState } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import type { DvlaLookupResult, DvlaVehicleData } from '../types'

// Mock response used in demo mode (no Supabase needed)
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
  const [result, setResult] = useState<DvlaLookupResult | null>(null)

  const lookup = async (registration: string): Promise<DvlaLookupResult> => {
    if (!registration.trim()) {
      return { success: false, error: 'Enter a registration number first' }
    }

    setLoading(true)
    setResult(null)

    try {
      let res: DvlaLookupResult

      if (isDemoMode || !supabase) {
        // Simulate a small delay in demo mode
        await new Promise(r => setTimeout(r, 800))
        res = { success: true, data: mockLookup(registration) }
      } else {
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('dvla-lookup', {
          body: { registration },
        })
        if (error) {
          res = { success: false, error: error.message || 'Lookup failed' }
        } else {
          res = data as DvlaLookupResult
        }
      }

      setResult(res)
      return res
    } catch (err) {
      const res: DvlaLookupResult = {
        success: false,
        error: 'Network error — please try again',
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
