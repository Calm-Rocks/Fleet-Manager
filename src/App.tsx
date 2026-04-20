import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useApp } from './hooks/useApp'
import { useAuth } from './hooks/useAuth'
import { reminderStatus } from './utils'
import { Spinner } from './components/UI'
import { ProtectedRoute } from './components/ProtectedRoute'

import Dashboard    from './pages/Dashboard'
import Vehicles     from './pages/Vehicles'
import Reminders    from './pages/Reminders'
import MileagePage  from './pages/Mileage'
import ExpensesPage from './pages/Expenses'
import IncomePage   from './pages/Income'
import Settings     from './pages/Settings'
import SignIn       from './pages/SignIn'
import SignUp       from './pages/SignUp'

const NAV_ITEMS = [
  { path: '/',          icon: '▤',  label: 'Dashboard'  },
  { path: '/vehicles',  icon: '🚐', label: 'Vehicles'   },
  { path: '/reminders', icon: '⏰', label: 'Reminders'  },
  { path: '/mileage',   icon: '📍', label: 'Mileage'    },
  { path: '/expenses',  icon: '📋', label: 'Expenses'   },
  { path: '/income',    icon: '💷', label: 'Income'     },
]

// ── Authenticated shell (sidebar + main) ──────────────────────────────────────
function AppShell() {
  const { vehicles } = useApp()
  const { profile, company, signOut, isDemoMode } = useAuth()

  const overdueCount = vehicles.filter(v =>
    ['mot_expiry', 'tax_expiry', 'insurance_expiry', 'service_due_date'].some(
      k => reminderStatus(v[k as keyof typeof v] as string) === 'overdue'
    )
  ).length

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F7F4]">
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[220px] flex-col bg-white border-r border-[#E5E3DD] flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#E5E3DD]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1A3A5C] rounded-[6px] flex items-center justify-center text-white text-[12px] font-bold">
              FM
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#1A3A5C] tracking-[-0.3px] leading-tight truncate">
                Fleet Manager
              </p>
              {company?.name && (
                <p className="text-[11px] text-[#9B9890] truncate">{company.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="w-[18px] text-center text-[15px]">{item.icon}</span>
              <span>{item.label}</span>
              {item.path === '/reminders' && overdueCount > 0 && (
                <span className="ml-auto bg-[#991B1B] text-white text-[10px] font-bold rounded-full px-1.5 py-px">
                  {overdueCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User / settings footer */}
        <div className="border-t border-[#E5E3DD] p-2">
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="w-[18px] text-center text-[15px]">⚙</span>
            <span>Settings</span>
          </NavLink>

          {/* User pill */}
          <div className="flex items-center gap-2.5 px-2.5 py-2 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#1A3A5C] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#1A1916] truncate">
                {profile?.full_name || profile?.email || 'User'}
              </p>
              {isDemoMode && (
                <p className="text-[10px] text-[#9B9890]">Demo mode</p>
              )}
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="text-[#9B9890] hover:text-[#991B1B] transition-colors text-[13px] flex-shrink-0"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/vehicles/*"  element={<Vehicles />} />
            <Route path="/reminders"   element={<Reminders />} />
            <Route path="/mileage"     element={<MileagePage />} />
            <Route path="/expenses"    element={<ExpensesPage />} />
            <Route path="/income"      element={<IncomePage />} />
            <Route path="/settings/*"  element={<Settings />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
        <nav className="md:hidden flex border-t border-[#E5E3DD] bg-white">
          {[...NAV_ITEMS, { path: '/settings', icon: '⚙', label: 'Settings' }].map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors relative
                 ${isActive ? 'text-[#2563EB]' : 'text-[#6B6860]'}`
              }
            >
              <span className="text-[17px] leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {item.path === '/reminders' && overdueCount > 0 && (
                <span className="absolute top-1 right-1/4 bg-[#991B1B] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {overdueCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  )
}

// ── Root app — handles auth gating ────────────────────────────────────────────
export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected shell — all app routes live inside */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
