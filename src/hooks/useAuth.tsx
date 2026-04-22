import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isDemoMode } from '../lib/supabase'
import type { Profile, Company } from '../types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  company: Company | null
  loading: boolean
  isDemoMode: boolean
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  updateCompany: (updates: Partial<Company>) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ── Demo constants ─────────────────────────────────────────────────────────────
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@fleetmanager.co.uk',
  app_metadata: {}, user_metadata: {}, aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const DEMO_PROFILE: Profile = {
  id: 'demo-user-id', full_name: 'Demo User',
  email: 'demo@fleetmanager.co.uk', company_id: 'demo-company-id',
}

const DEMO_COMPANY: Company = {
  id: 'demo-company-id', name: 'Demo Fleet Co',
  city: 'Sheffield', postcode: 'S1 1AA',
  phone: '0114 000 0000', email: 'demo@fleetmanager.co.uk',
}

// ── Load profile + company for a user ─────────────────────────────────────────
// Returns { profile, company } fetched fresh from Supabase every time.
// No caching — always authoritative.
async function fetchUserData(userId: string): Promise<{ profile: Profile | null; company: Company | null }> {
  if (!supabase) return { profile: null, company: null }

  // 1. Get profile
  const { data: prof, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profErr || !prof) {
    console.error('fetchUserData: profile error', profErr?.message)
    return { profile: null, company: null }
  }

  // 2. Resolve company_id from profile, or fall back to company_members
  let companyId: string | null = prof.company_id ?? null

  if (!companyId) {
    const { data: mem } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (mem?.company_id) {
      companyId = mem.company_id
      // Patch profile so future loads use the fast path
      await supabase.from('profiles').update({ company_id: companyId }).eq('id', userId)
      prof.company_id = companyId
    }
  }

  if (!companyId) {
    console.error('fetchUserData: no company_id for user', userId)
    return { profile: prof, company: null }
  }

  // 3. Get company
  const { data: comp, error: compErr } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (compErr || !comp) {
    console.error('fetchUserData: company error', compErr?.message)
    return { profile: prof, company: null }
  }

  return { profile: prof, company: comp }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Bootstrap on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      setUser(DEMO_USER)
      setProfile(DEMO_PROFILE)
      setCompany(DEMO_COMPANY)
      setLoading(false)
      return
    }

    let mounted = true

    // Hard timeout — if Supabase doesn't respond in 6s, stop loading.
    // ProtectedRoute will redirect to /signin since user will still be null.
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth timed out — redirecting to sign in')
        setLoading(false)
      }
    }, 6000)

    // First: set up the auth state listener BEFORE calling getSession.
    // This ensures we don't miss any auth events that fire during init.
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      clearTimeout(timeout)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const { profile, company } = await fetchUserData(session.user.id)
        if (!mounted) return
        setProfile(profile)
        setCompany(company)
      } else {
        setProfile(null)
        setCompany(null)
      }

      if (mounted) setLoading(false)
    })

    // Then: check for existing session (handles page refresh)
    supabase!.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return
      if (error) console.error('getSession error:', error.message)

      if (session?.user) {
        setSession(session)
        setUser(session.user)
        const { profile, company } = await fetchUserData(session.user.id)
        if (!mounted) return
        setProfile(profile)
        setCompany(company)
      }

      clearTimeout(timeout)
      if (mounted) setLoading(false)
    }).catch(err => {
      console.error('getSession threw:', err)
      clearTimeout(timeout)
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  // ── Sign up ────────────────────────────────────────────────────────────────
  const signUp = async (
    email: string, password: string, fullName: string, companyName: string
  ): Promise<{ error: string | null }> => {
    if (isDemoMode) return { error: null }
    if (!supabase) return { error: 'Supabase not configured' }

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Sign up failed' }

    // Create company
    const { data: comp, error: compErr } = await supabase
      .from('companies').insert({ name: companyName }).select().single()
    if (compErr) return { error: compErr.message }

    // Create membership
    await supabase.from('company_members').insert({
      company_id: comp.id, user_id: data.user.id, role: 'owner',
    })

    // Update profile
    await supabase.from('profiles')
      .update({ full_name: fullName, company_id: comp.id })
      .eq('id', data.user.id)

    return { error: null }
  }

  // ── Sign in ────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isDemoMode) return { error: null }
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    if (isDemoMode) return
    setUser(null); setSession(null); setProfile(null); setCompany(null)
    await supabase!.auth.signOut()
  }

  // ── Update profile ─────────────────────────────────────────────────────────
  const updateProfile = async (updates: Partial<Profile>) => {
    if (isDemoMode) { setProfile(p => p ? { ...p, ...updates } : p); return }
    if (!supabase) return

    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id
    if (!uid) { console.error('updateProfile: not authenticated'); return }

    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', uid).select().single()
    if (error) { console.error('updateProfile error:', error.message); return }
    if (data) setProfile(data)
  }

  // ── Update company ─────────────────────────────────────────────────────────
  const updateCompany = async (updates: Partial<Company>) => {
    if (isDemoMode) { setCompany(c => c ? { ...c, ...updates } : c); return }
    if (!supabase) return

    // Always resolve company_id fresh from Supabase — never trust stale state
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id
    if (!uid) { console.error('updateCompany: not authenticated'); return }

    const { data: prof } = await supabase
      .from('profiles').select('company_id').eq('id', uid).single()
    const cid = prof?.company_id || company?.id
    if (!cid) { console.error('updateCompany: no company_id'); return }

    const { data, error } = await supabase
      .from('companies').update(updates).eq('id', cid).select().single()
    if (error) { console.error('updateCompany error:', error.message); return }
    if (data) setCompany(data)
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, company, loading, isDemoMode,
      signUp, signIn, signOut, updateProfile, updateCompany,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
