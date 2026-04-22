import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Vehicle, ExpenseEntry, IncomeEntry, MileageEntry, Driver } from '../types'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from './useAuth'
import { SAMPLE_VEHICLES, SAMPLE_EXPENSES, SAMPLE_INCOME, SAMPLE_MILEAGE } from '../lib/sampleData'
import { SAMPLE_DRIVERS } from '../lib/sampleDrivers'
import { uid } from '../utils'

interface AppState {
  vehicles: Vehicle[]
  expenses: ExpenseEntry[]
  income:   IncomeEntry[]
  mileage:  MileageEntry[]
  drivers:  Driver[]
  loading:  boolean
  isDemoMode: boolean
  saveVehicle:   (v: Vehicle) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  addExpense:    (e: ExpenseEntry) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addIncome:     (i: IncomeEntry) => Promise<void>
  deleteIncome:  (id: string) => Promise<void>
  addMileage:    (m: MileageEntry) => Promise<void>
  deleteMileage: (id: string) => Promise<void>
  saveDriver:    (d: Driver) => Promise<void>
  deleteDriver:  (id: string) => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export const useApp = (): AppState => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// ── Get user_id + company_id fresh from Supabase at call time ─────────────────
// This is called on every save operation. It reads the live session from
// Supabase's own localStorage key (not our code's state) so it's always
// accurate regardless of React render cycles.
async function getIds(): Promise<{ user_id: string; company_id: string } | null> {
  if (!supabase) return null

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    console.error('getIds: no active session')
    return null
  }

  const { data: prof, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', session.user.id)
    .single()

  if (error || !prof?.company_id) {
    console.error('getIds: could not resolve company_id', error?.message)
    return null
  }

  return { user_id: session.user.id, company_id: prof.company_id }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { company } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [income,   setIncome]   = useState<IncomeEntry[]>([])
  const [mileage,  setMileage]  = useState<MileageEntry[]>([])
  const [drivers,  setDrivers]  = useState<Driver[]>([])
  const [loading,  setLoading]  = useState(true)

  // ── Load all fleet data when company is known ─────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      setVehicles(SAMPLE_VEHICLES)
      setExpenses(SAMPLE_EXPENSES)
      setIncome(SAMPLE_INCOME)
      setMileage(SAMPLE_MILEAGE)
      setDrivers(SAMPLE_DRIVERS)
      setLoading(false)
      return
    }

    if (!supabase || !company?.id) {
      // Don't show loading forever if no company — just show empty state
      setLoading(false)
      return
    }

    const cid = company.id

    const load = async () => {
      setLoading(true)
      try {
        const [v, e, i, m, d] = await Promise.all([
          supabase!.from('vehicles')       .select('*').eq('company_id', cid).order('created_at', { ascending: false }),
          supabase!.from('expense_entries').select('*').eq('company_id', cid).order('date',       { ascending: false }),
          supabase!.from('income_entries') .select('*').eq('company_id', cid).order('date',       { ascending: false }),
          supabase!.from('mileage_entries').select('*').eq('company_id', cid).order('date',       { ascending: false }),
          supabase!.from('drivers')        .select('*').eq('company_id', cid).order('last_name',  { ascending: true }),
        ])
        if (v.error) console.error('vehicles load error:', v.error.message)
        if (e.error) console.error('expenses load error:', e.error.message)
        if (i.error) console.error('income load error:',   i.error.message)
        if (m.error) console.error('mileage load error:',  m.error.message)
        if (d.error) console.error('drivers load error:',  d.error.message)
        if (v.data) setVehicles(v.data)
        if (e.data) setExpenses(e.data)
        if (i.data) setIncome(i.data)
        if (m.data) setMileage(m.data)
        if (d.data) setDrivers(d.data)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [company?.id]) // Re-runs whenever company changes (login, switch company)

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const saveVehicle = useCallback(async (v: Vehicle) => {
    const isNew = !vehicles.find(x => x.id === v.id)
    const tempId = v.id || uid()

    // Optimistic UI update
    if (isNew) setVehicles(prev => [{ ...v, id: tempId }, ...prev])
    else       setVehicles(prev => prev.map(x => x.id === v.id ? v : x))

    if (isDemoMode || !supabase) return

    const ids = await getIds()
    if (!ids) {
      if (isNew) setVehicles(prev => prev.filter(x => x.id !== tempId))
      return
    }

    const record = { ...v, id: tempId, ...ids }

    if (isNew) {
      const { data, error } = await supabase.from('vehicles').insert(record).select().single()
      if (error) {
        console.error('saveVehicle error:', error.message)
        setVehicles(prev => prev.filter(x => x.id !== tempId))
        return
      }
      if (data) setVehicles(prev => prev.map(x => x.id === tempId ? data : x))
    } else {
      const { data, error } = await supabase.from('vehicles').update(record).eq('id', v.id).select().single()
      if (error) { console.error('updateVehicle error:', error.message); return }
      if (data) setVehicles(prev => prev.map(x => x.id === v.id ? data : x))
    }
  }, [vehicles])

  const deleteVehicle = useCallback(async (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id))
    if (isDemoMode || !supabase) return
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) console.error('deleteVehicle error:', error.message)
  }, [])

  // ── Expenses ──────────────────────────────────────────────────────────────
  const addExpense = useCallback(async (e: ExpenseEntry) => {
    setExpenses(prev => [e, ...prev])
    if (isDemoMode || !supabase) return

    const ids = await getIds()
    if (!ids) { setExpenses(prev => prev.filter(x => x.id !== e.id)); return }

    const { data, error } = await supabase
      .from('expense_entries').insert({ ...e, ...ids }).select().single()
    if (error) {
      console.error('addExpense error:', error.message)
      setExpenses(prev => prev.filter(x => x.id !== e.id))
      return
    }
    if (data) setExpenses(prev => prev.map(x => x.id === e.id ? data : x))
  }, [])

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    if (isDemoMode || !supabase) return
    await supabase.from('expense_entries').delete().eq('id', id)
  }, [])

  // ── Income ────────────────────────────────────────────────────────────────
  const addIncome = useCallback(async (i: IncomeEntry) => {
    setIncome(prev => [i, ...prev])
    if (isDemoMode || !supabase) return

    const ids = await getIds()
    if (!ids) { setIncome(prev => prev.filter(x => x.id !== i.id)); return }

    const { data, error } = await supabase
      .from('income_entries').insert({ ...i, ...ids }).select().single()
    if (error) {
      console.error('addIncome error:', error.message)
      setIncome(prev => prev.filter(x => x.id !== i.id))
      return
    }
    if (data) setIncome(prev => prev.map(x => x.id === i.id ? data : x))
  }, [])

  const deleteIncome = useCallback(async (id: string) => {
    setIncome(prev => prev.filter(i => i.id !== id))
    if (isDemoMode || !supabase) return
    await supabase.from('income_entries').delete().eq('id', id)
  }, [])

  // ── Mileage ───────────────────────────────────────────────────────────────
  const addMileage = useCallback(async (m: MileageEntry) => {
    setMileage(prev => [m, ...prev])
    setVehicles(prev => prev.map(v =>
      v.id === m.vehicle_id && parseInt(String(m.end_mileage)) > parseInt(String(v.current_mileage))
        ? { ...v, current_mileage: m.end_mileage } : v
    ))
    if (isDemoMode || !supabase) return

    const ids = await getIds()
    if (!ids) { setMileage(prev => prev.filter(x => x.id !== m.id)); return }

    const { data, error } = await supabase
      .from('mileage_entries').insert({ ...m, ...ids }).select().single()
    if (error) {
      console.error('addMileage error:', error.message)
      setMileage(prev => prev.filter(x => x.id !== m.id))
      return
    }
    if (data) {
      setMileage(prev => prev.map(x => x.id === m.id ? data : x))
      const vehicle = vehicles.find(v => v.id === m.vehicle_id)
      if (vehicle && parseInt(String(m.end_mileage)) > parseInt(String(vehicle.current_mileage))) {
        await supabase.from('vehicles').update({ current_mileage: m.end_mileage }).eq('id', m.vehicle_id)
      }
    }
  }, [vehicles])

  const deleteMileage = useCallback(async (id: string) => {
    setMileage(prev => prev.filter(m => m.id !== id))
    if (isDemoMode || !supabase) return
    await supabase.from('mileage_entries').delete().eq('id', id)
  }, [])

  // ── Drivers ───────────────────────────────────────────────────────────────
  const saveDriver = useCallback(async (d: Driver) => {
    const isNew = !drivers.find(x => x.id === d.id)
    const tempId = d.id || uid()

    if (isNew) setDrivers(prev => [...prev, { ...d, id: tempId }].sort((a, b) => a.last_name.localeCompare(b.last_name)))
    else       setDrivers(prev => prev.map(x => x.id === d.id ? d : x))

    if (isDemoMode || !supabase) return

    const ids = await getIds()
    if (!ids) {
      if (isNew) setDrivers(prev => prev.filter(x => x.id !== tempId))
      return
    }

    const record = { ...d, id: tempId, ...ids }

    if (isNew) {
      const { data, error } = await supabase.from('drivers').insert(record).select().single()
      if (error) {
        console.error('saveDriver error:', error.message)
        setDrivers(prev => prev.filter(x => x.id !== tempId))
        return
      }
      if (data) setDrivers(prev =>
        prev.map(x => x.id === tempId ? data : x).sort((a, b) => a.last_name.localeCompare(b.last_name))
      )
    } else {
      const { data, error } = await supabase.from('drivers').update(record).eq('id', d.id).select().single()
      if (error) { console.error('updateDriver error:', error.message); return }
      if (data) setDrivers(prev => prev.map(x => x.id === d.id ? data : x))
    }
  }, [drivers])

  const deleteDriver = useCallback(async (id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id))
    if (isDemoMode || !supabase) return
    const { error } = await supabase.from('drivers').delete().eq('id', id)
    if (error) console.error('deleteDriver error:', error.message)
  }, [])

  return (
    <AppContext.Provider value={{
      vehicles, expenses, income, mileage, drivers, loading, isDemoMode,
      saveVehicle,  deleteVehicle,
      addExpense,   deleteExpense,
      addIncome,    deleteIncome,
      addMileage,   deleteMileage,
      saveDriver,   deleteDriver,
    }}>
      {children}
    </AppContext.Provider>
  )
}
