import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Vehicle, ExpenseEntry, IncomeEntry, MileageEntry } from '../types'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from './useAuth'
import { SAMPLE_VEHICLES, SAMPLE_EXPENSES, SAMPLE_INCOME, SAMPLE_MILEAGE } from '../lib/sampleData'
import { uid } from '../utils'

interface AppState {
  vehicles: Vehicle[]
  expenses: ExpenseEntry[]
  income: IncomeEntry[]
  mileage: MileageEntry[]
  loading: boolean
  isDemoMode: boolean
  saveVehicle: (v: Vehicle) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  addExpense: (e: ExpenseEntry) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addIncome: (i: IncomeEntry) => Promise<void>
  deleteIncome: (id: string) => Promise<void>
  addMileage: (m: MileageEntry) => Promise<void>
  deleteMileage: (id: string) => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export const useApp = (): AppState => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, company } = useAuth()
  const [vehicles, setVehicles]   = useState<Vehicle[]>([])
  const [expenses, setExpenses]   = useState<ExpenseEntry[]>([])
  const [income,   setIncome]     = useState<IncomeEntry[]>([])
  const [mileage,  setMileage]    = useState<MileageEntry[]>([])
  const [loading,  setLoading]    = useState(true)

  // ── Helper: stamp user_id + company_id onto new records ───────────────────
  const stamp = <T extends object>(record: T): T & { user_id: string; company_id: string } => ({
    ...record,
    user_id:    user?.id    || 'demo-user-id',
    company_id: company?.id || 'demo-company-id',
  })

  // ── Load data scoped to the user's company ────────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      setVehicles(SAMPLE_VEHICLES)
      setExpenses(SAMPLE_EXPENSES)
      setIncome(SAMPLE_INCOME)
      setMileage(SAMPLE_MILEAGE)
      setLoading(false)
      return
    }

    if (!supabase || !company?.id) {
      setLoading(false)
      return
    }

    const cid = company.id

    const load = async () => {
      setLoading(true)
      const [v, e, i, m] = await Promise.all([
        supabase!.from('vehicles')       .select('*').eq('company_id', cid).order('created_at', { ascending: false }),
        supabase!.from('expense_entries').select('*').eq('company_id', cid).order('date',       { ascending: false }),
        supabase!.from('income_entries') .select('*').eq('company_id', cid).order('date',       { ascending: false }),
        supabase!.from('mileage_entries').select('*').eq('company_id', cid).order('date',       { ascending: false }),
      ])
      if (v.data) setVehicles(v.data)
      if (e.data) setExpenses(e.data)
      if (i.data) setIncome(i.data)
      if (m.data) setMileage(m.data)
      setLoading(false)
    }

    load()
  }, [company?.id]) // re-fetch if user switches company

  // ── Vehicles ───────────────────────────────────────────────────────────────
  const saveVehicle = useCallback(async (v: Vehicle) => {
    const isNew = !vehicles.find(x => x.id === v.id)
    if (isDemoMode) {
      setVehicles(prev =>
        isNew ? [...prev, { ...v, id: v.id || uid() }] : prev.map(x => x.id === v.id ? v : x)
      )
      return
    }
    if (!supabase) return
    const record = stamp(v)
    if (isNew) {
      const { data } = await supabase.from('vehicles').insert(record).select().single()
      if (data) setVehicles(prev => [data, ...prev])
    } else {
      const { data } = await supabase.from('vehicles').update(record).eq('id', v.id).select().single()
      if (data) setVehicles(prev => prev.map(x => x.id === v.id ? data : x))
    }
  }, [vehicles, user, company])

  const deleteVehicle = useCallback(async (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id))
    if (isDemoMode || !supabase) return
    await supabase.from('vehicles').delete().eq('id', id)
  }, [])

  // ── Expenses ───────────────────────────────────────────────────────────────
  const addExpense = useCallback(async (e: ExpenseEntry) => {
    if (isDemoMode || !supabase) { setExpenses(prev => [e, ...prev]); return }
    const { data } = await supabase.from('expense_entries').insert(stamp(e)).select().single()
    if (data) setExpenses(prev => [data, ...prev])
  }, [user, company])

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    if (isDemoMode || !supabase) return
    await supabase.from('expense_entries').delete().eq('id', id)
  }, [])

  // ── Income ─────────────────────────────────────────────────────────────────
  const addIncome = useCallback(async (i: IncomeEntry) => {
    if (isDemoMode || !supabase) { setIncome(prev => [i, ...prev]); return }
    const { data } = await supabase.from('income_entries').insert(stamp(i)).select().single()
    if (data) setIncome(prev => [data, ...prev])
  }, [user, company])

  const deleteIncome = useCallback(async (id: string) => {
    setIncome(prev => prev.filter(i => i.id !== id))
    if (isDemoMode || !supabase) return
    await supabase.from('income_entries').delete().eq('id', id)
  }, [])

  // ── Mileage ────────────────────────────────────────────────────────────────
  const addMileage = useCallback(async (m: MileageEntry) => {
    // Optimistically update vehicle mileage
    const updateVehicleMileage = (endMileage: number | string) => {
      setVehicles(prev => prev.map(v =>
        v.id === m.vehicle_id && parseInt(String(endMileage)) > parseInt(String(v.current_mileage))
          ? { ...v, current_mileage: endMileage }
          : v
      ))
    }

    if (isDemoMode || !supabase) {
      setMileage(prev => [m, ...prev])
      updateVehicleMileage(m.end_mileage)
      return
    }

    const { data } = await supabase.from('mileage_entries').insert(stamp(m)).select().single()
    if (data) {
      setMileage(prev => [data, ...prev])
      updateVehicleMileage(m.end_mileage)
      // Also persist updated mileage on the vehicle record
      const vehicle = vehicles.find(v => v.id === m.vehicle_id)
      if (vehicle && parseInt(String(m.end_mileage)) > parseInt(String(vehicle.current_mileage))) {
        await supabase.from('vehicles').update({ current_mileage: m.end_mileage }).eq('id', m.vehicle_id)
      }
    }
  }, [vehicles, user, company])

  const deleteMileage = useCallback(async (id: string) => {
    setMileage(prev => prev.filter(m => m.id !== id))
    if (isDemoMode || !supabase) return
    await supabase.from('mileage_entries').delete().eq('id', id)
  }, [])

  return (
    <AppContext.Provider value={{
      vehicles, expenses, income, mileage, loading, isDemoMode,
      saveVehicle,  deleteVehicle,
      addExpense,   deleteExpense,
      addIncome,    deleteIncome,
      addMileage,   deleteMileage,
    }}>
      {children}
    </AppContext.Provider>
  )
}
