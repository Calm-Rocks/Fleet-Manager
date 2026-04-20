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

// Demo mode fake user
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@fleetmanager.co.uk',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const DEMO_PROFILE: Profile = {
  id: 'demo-user-id',
  full_name: 'Demo User',
  email: 'demo@fleetmanager.co.uk',
  company_id: 'demo-company-id',
}

const DEMO_COMPANY: Company = {
  id: 'demo-company-id',
  name: 'Demo Fleet Co',
  city: 'Sheffield',
  postcode: 'S1 1AA',
  phone: '0114 000 0000',
  email: 'demo@fleetmanager.co.uk',
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Load profile + company for a given user ────────────────────────────────
  const loadUserData = async (u: User) => {
    if (!supabase) return

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', u.id)
      .single()

    if (prof) {
      setProfile(prof)
      if (prof.company_id) {
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('id', prof.company_id)
          .single()
        if (comp) setCompany(comp)
      }
    }
  }

  // ── Bootstrap auth state ───────────────────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      setUser(DEMO_USER)
      setProfile(DEMO_PROFILE)
      setCompany(DEMO_COMPANY)
      setLoading(false)
      return
    }

    // Get current session
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUserData(session.user)
        } else {
          setProfile(null)
          setCompany(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Sign up ────────────────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    companyName: string
  ): Promise<{ error: string | null }> => {
    if (isDemoMode) return { error: null }
    if (!supabase) return { error: 'Supabase not configured' }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) return { error: error.message }
    if (!data.user) return { error: 'Sign up failed — please try again' }

    // Create company
    const { data: comp, error: compError } = await supabase
      .from('companies')
      .insert({ name: companyName })
      .select()
      .single()

    if (compError) return { error: compError.message }

    // Create company_members record (owner)
    await supabase.from('company_members').insert({
      company_id: comp.id,
      user_id: data.user.id,
      role: 'owner',
    })

    // Update profile with name + company
    await supabase
      .from('profiles')
      .update({ full_name: fullName, company_id: comp.id })
      .eq('id', data.user.id)

    setCompany(comp)
    return { error: null }
  }

  // ── Sign in ────────────────────────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    if (isDemoMode) return { error: null }
    if (!supabase) return { error: 'Supabase not configured' }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    if (isDemoMode) return
    await supabase!.auth.signOut()
    setProfile(null)
    setCompany(null)
  }

  // ── Update profile ─────────────────────────────────────────────────────────
  const updateProfile = async (updates: Partial<Profile>) => {
    if (isDemoMode) {
      setProfile(prev => prev ? { ...prev, ...updates } : prev)
      return
    }
    if (!supabase || !user) return
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (data) setProfile(data)
  }

  // ── Update company ─────────────────────────────────────────────────────────
  const updateCompany = async (updates: Partial<Company>) => {
    if (isDemoMode) {
      setCompany(prev => prev ? { ...prev, ...updates } : prev)
      return
    }
    if (!supabase || !company) return
    const { data } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', company.id)
      .select()
      .single()
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
