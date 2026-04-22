import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { PageHeader, Divider } from '../components/UI'
import type { Integration } from '../types'

// ── Integrations catalogue ────────────────────────────────────────────────────
const INTEGRATIONS: Integration[] = [
  // Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync expenses and income with your QuickBooks account. Expenses become bills, income becomes invoices.',
    icon: '🟢',
    status: 'coming_soon',
    category: 'accounting',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Push fleet costs and revenue directly into Xero for seamless bookkeeping.',
    icon: '🔵',
    status: 'coming_soon',
    category: 'accounting',
  },
  {
    id: 'sage',
    name: 'Sage 50',
    description: 'Connect to Sage for automated expense and invoice reconciliation.',
    icon: '🟩',
    status: 'coming_soon',
    category: 'accounting',
  },
  // Jobs
  {
    id: 'jobber',
    name: 'Jobber',
    description: 'Automatically log income entries when jobs are completed in Jobber.',
    icon: '🔧',
    status: 'coming_soon',
    category: 'jobs',
  },
  {
    id: 'servicem8',
    name: 'ServiceM8',
    description: 'Pull completed job data from ServiceM8 and create income records per vehicle.',
    icon: '📋',
    status: 'coming_soon',
    category: 'jobs',
  },
  {
    id: 'commusoft',
    name: 'Commusoft',
    description: 'Sync job completions and invoices from Commusoft into Fleet Manager.',
    icon: '🛠',
    status: 'coming_soon',
    category: 'jobs',
  },
  // Government / compliance
  {
    id: 'dvla',
    name: 'DVLA Vehicle Lookup',
    description: 'Look up any UK registration to auto-fill vehicle details, MOT expiry, and tax status.',
    icon: '🇬🇧',
    status: 'connected',
    category: 'government',
  },
  {
    id: 'dvsa',
    name: 'DVSA MOT History',
    description: 'Pull full MOT history for any vehicle directly from the DVSA database.',
    icon: '🔍',
    status: 'coming_soon',
    category: 'government',
  },
  // Telematics
  {
    id: 'samsara',
    name: 'Samsara',
    description: 'Auto-import mileage and engine hours from Samsara GPS trackers.',
    icon: '📡',
    status: 'coming_soon',
    category: 'telematics',
  },
  {
    id: 'verizon',
    name: 'Verizon Connect',
    description: 'Sync live mileage and location data from Verizon Connect fleet tracking.',
    icon: '🗺',
    status: 'coming_soon',
    category: 'telematics',
  },
  // Automation
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect Fleet Manager to 5,000+ apps via Zapier. Trigger automations on new expenses, overdue reminders, and more.',
    icon: '⚡',
    status: 'coming_soon',
    category: 'automation',
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Build advanced workflows between Fleet Manager and your other business tools.',
    icon: '🔗',
    status: 'coming_soon',
    category: 'automation',
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  accounting: 'Accounting',
  jobs: 'Job management',
  government: 'Government & compliance',
  telematics: 'Telematics & GPS',
  automation: 'Automation',
}

// ── Sub-pages ─────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'company' | 'integrations' | 'account'

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile',      label: 'Profile'       },
    { id: 'company',      label: 'Company'        },
    { id: 'integrations', label: 'Integrations'   },
    { id: 'account',      label: 'Account'        },
  ]

  return (
    <div className="p-6 md:p-7 max-w-3xl">
      <PageHeader title="Settings" />

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#F2F0EC] p-1 rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              tab === t.id
                ? 'bg-white text-[#1A1916] shadow-sm'
                : 'text-[#6B6860] hover:text-[#1A1916]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile'      && <ProfileTab />}
      {tab === 'company'      && <CompanyTab />}
      {tab === 'integrations' && <IntegrationsTab />}
      {tab === 'account'      && <AccountTab />}
    </div>
  )
}

// ── Profile tab ───────────────────────────────────────────────────────────────
function ProfileTab() {
  const { profile, user, updateProfile, isDemoMode } = useAuth()
  // Track edits separately — only populated when user types something
  const [edits, setEdits] = useState<{ full_name?: string }>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Clear edits when profile reloads (e.g. after save, or on navigation back)
  useEffect(() => { setEdits({}) }, [profile?.id])

  // Display value: edited value takes priority, then loaded profile value
  const fullName = edits.full_name !== undefined ? edits.full_name : (profile?.full_name || '')

  const save = async () => {
    setSaving(true)
    await updateProfile({ full_name: fullName })
    setSaving(false)
    setSaved(true)
    setEdits({})
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="fm-card max-w-lg">
      <p className="text-[13px] font-semibold mb-4">Personal details</p>

      <div className="mb-3.5">
        <label className="fm-label">Full name</label>
        <input
          className="fm-input"
          value={fullName}
          onChange={e => setEdits(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Your name"
        />
      </div>
      <div className="mb-5">
        <label className="fm-label">Email address</label>
        <input
          className="fm-input bg-[#F8F7F4] cursor-not-allowed"
          value={user?.email || ''}
          readOnly
          title="Email cannot be changed here"
        />
        <p className="text-[11px] text-[#9B9890] mt-1">To change your email, contact support.</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-[12px] text-[#166534] font-medium">Saved ✓</span>}
        {isDemoMode && (
          <span className="text-[11px] text-[#9B9890]">Demo mode — changes not persisted</span>
        )}
      </div>
    </div>
  )
}

// ── Company tab ───────────────────────────────────────────────────────────────
type CompanyForm = {
  name: string; address_line1: string; address_line2: string
  city: string; postcode: string; phone: string; email: string
  vat_number: string; companies_house_number: string
}

function CompanyTab() {
  const { company, updateCompany, isDemoMode } = useAuth()
  // Track only what the user has edited — everything else reads from company directly
  const [edits, setEdits] = useState<Partial<CompanyForm>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Clear edits when company reloads
  useEffect(() => { setEdits({}) }, [company?.id])

  // For each field: edited value takes priority, then loaded company value
  const val = (k: keyof CompanyForm): string =>
    edits[k] !== undefined ? (edits[k] as string) : ((company?.[k as keyof typeof company] as string) || '')

  const set = (k: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEdits(prev => ({ ...prev, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    // Merge edits onto current company values and save the full object
    const updates: Partial<CompanyForm> = {
      name:                   val('name'),
      address_line1:          val('address_line1'),
      address_line2:          val('address_line2'),
      city:                   val('city'),
      postcode:               val('postcode'),
      phone:                  val('phone'),
      email:                  val('email'),
      vat_number:             val('vat_number'),
      companies_house_number: val('companies_house_number'),
    }
    await updateCompany(updates)
    setSaving(false)
    setSaved(true)
    setEdits({})
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="fm-card max-w-lg">
      <p className="text-[13px] font-semibold mb-4">Company details</p>

      <div className="mb-3.5">
        <label className="fm-label">Company name *</label>
        <input className="fm-input" value={val('name')} onChange={set('name')} placeholder="Smith Logistics Ltd" />
      </div>

      <Divider />
      <p className="text-[11px] font-semibold text-[#9B9890] uppercase tracking-[0.5px] mb-3">Address</p>

      <div className="mb-3.5">
        <label className="fm-label">Address line 1</label>
        <input className="fm-input" value={val('address_line1')} onChange={set('address_line1')} placeholder="123 Industrial Way" />
      </div>
      <div className="mb-3.5">
        <label className="fm-label">Address line 2</label>
        <input className="fm-input" value={val('address_line2')} onChange={set('address_line2')} placeholder="Unit 4" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3.5">
        <div>
          <label className="fm-label">City</label>
          <input className="fm-input" value={val('city')} onChange={set('city')} placeholder="Sheffield" />
        </div>
        <div>
          <label className="fm-label">Postcode</label>
          <input className="fm-input" value={val('postcode')} onChange={set('postcode')} placeholder="S1 1AA" />
        </div>
      </div>

      <Divider />
      <p className="text-[11px] font-semibold text-[#9B9890] uppercase tracking-[0.5px] mb-3">Contact</p>

      <div className="grid grid-cols-2 gap-3 mb-3.5">
        <div>
          <label className="fm-label">Phone</label>
          <input className="fm-input" value={val('phone')} onChange={set('phone')} placeholder="0114 000 0000" />
        </div>
        <div>
          <label className="fm-label">Email</label>
          <input className="fm-input" type="email" value={val('email')} onChange={set('email')} placeholder="info@company.co.uk" />
        </div>
      </div>

      <Divider />
      <p className="text-[11px] font-semibold text-[#9B9890] uppercase tracking-[0.5px] mb-3">Registration numbers</p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="fm-label">VAT number</label>
          <input className="fm-input" value={val('vat_number')} onChange={set('vat_number')} placeholder="GB123456789" />
        </div>
        <div>
          <label className="fm-label">Companies House no.</label>
          <input className="fm-input" value={val('companies_house_number')} onChange={set('companies_house_number')} placeholder="12345678" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save company details'}
        </button>
        {saved && <span className="text-[12px] text-[#166534] font-medium">Saved ✓</span>}
        {isDemoMode && (
          <span className="text-[11px] text-[#9B9890]">Demo mode — changes not persisted</span>
        )}
      </div>
    </div>
  )
}

// ── Integrations tab ──────────────────────────────────────────────────────────
function IntegrationsTab() {
  const categories = [...new Set(INTEGRATIONS.map(i => i.category))]

  return (
    <div>
      <p className="text-[13px] text-[#6B6860] mb-6 max-w-lg">
        Connect Fleet Manager to the tools your business already uses. 
        Each integration syncs data automatically so you're never manually copying between systems.
      </p>

      {categories.map(cat => (
        <div key={cat} className="mb-8">
          <h2 className="text-[12px] font-semibold text-[#6B6860] uppercase tracking-[0.6px] mb-3">
            {CATEGORY_LABELS[cat]}
          </h2>
          <div className="grid gap-3">
            {INTEGRATIONS.filter(i => i.category === cat).map(integration => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const statusConfig = {
    connected:    { badge: 'badge-ok',   label: 'Connected'   },
    disconnected: { badge: 'badge-gray', label: 'Not connected' },
    coming_soon:  { badge: 'badge-info', label: 'Coming soon'  },
  }
  const { badge, label } = statusConfig[integration.status]

  return (
    <div className="fm-card flex items-start gap-4">
      <div className="w-10 h-10 bg-[#F2F0EC] rounded-lg flex items-center justify-center text-xl flex-shrink-0">
        {integration.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[14px] font-semibold">{integration.name}</p>
          <span className={`badge ${badge}`}>{label}</span>
        </div>
        <p className="text-[12px] text-[#6B6860] leading-relaxed">{integration.description}</p>
      </div>
      <div className="flex-shrink-0">
        {integration.status === 'connected' ? (
          <button className="btn btn-secondary btn-sm">Configure</button>
        ) : integration.status === 'disconnected' ? (
          <button className="btn btn-primary btn-sm">Connect</button>
        ) : (
          <button className="btn btn-secondary btn-sm opacity-50 cursor-not-allowed" disabled>
            Coming soon
          </button>
        )}
      </div>
    </div>
  )
}

// ── Account tab ───────────────────────────────────────────────────────────────
function AccountTab() {
  const { signOut, user, isDemoMode } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="max-w-lg space-y-4">
      {/* Session info */}
      <div className="fm-card">
        <p className="text-[13px] font-semibold mb-3">Session</p>
        <div className="flex justify-between items-center text-[13px]">
          <div>
            <p className="font-medium">{user?.email}</p>
            <p className="text-[12px] text-[#9B9890] mt-0.5">
              {isDemoMode ? 'Demo session' : 'Authenticated via Supabase'}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      {/* Danger zone */}
      {!isDemoMode && (
        <div className="fm-card border-[#FECACA]">
          <p className="text-[13px] font-semibold text-[#991B1B] mb-3">Danger zone</p>
          <p className="text-[12px] text-[#6B6860] mb-3">
            Deleting your account permanently removes all your fleet data, vehicles, and records. This cannot be undone.
          </p>
          {!confirmDelete ? (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete account
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-[12px] text-[#991B1B] font-medium">Are you sure?</p>
              <button className="btn btn-danger btn-sm" onClick={() => alert('Contact support to delete your account.')}>
                Yes, delete everything
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
