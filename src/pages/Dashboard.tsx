import { useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/useApp'
import {
  fmt, fmtNum, reminderStatus, reminderLabel, daysUntil,
  calcDepreciation, sumByMonth, sumAll, groupByCategory,
} from '../utils'
import {
  StatCard, StatusBadge, SimpleBarChart, RegPill, PageHeader,
} from '../components/UI'
import type { ReminderItem, DriverReminderItem } from '../types'

const VEHICLE_CHECKS = [
  { k: 'mot_expiry',       l: 'MOT'      },
  { k: 'tax_expiry',       l: 'Tax'       },
  { k: 'insurance_expiry', l: 'Insurance' },
  { k: 'service_due_date', l: 'Service'   },
]

const DRIVER_CHECKS = [
  { k: 'licence_expiry',    l: 'Licence'    },
  { k: 'medical_expiry',    l: 'Medical'    },
  { k: 'cpc_expiry',        l: 'CPC'        },
  { k: 'tacho_card_expiry', l: 'Tacho card' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { vehicles, expenses, income, drivers } = useApp()

  // ── Financials ──────────────────────────────────────────────────────────────
  const monthInc = sumByMonth(income.map(i  => ({ date: i.date, amount: i.amount })))
  const monthExp = sumByMonth(expenses.map(e => ({ date: e.date, amount: e.amount })))
  const monthNet = monthInc - monthExp

  const totalFleetValue = vehicles.reduce((sum, v) => {
    const dep = calcDepreciation(v.purchase_price, parseInt(String(v.current_mileage)) || 0, v.condition)
    return sum + dep.currentValue
  }, 0)

  // ── Vehicle reminders ───────────────────────────────────────────────────────
  const vehicleReminders: ReminderItem[] = []
  vehicles.forEach(v => {
    VEHICLE_CHECKS.forEach(({ k, l }) => {
      const date   = v[k as keyof typeof v] as string
      const status = reminderStatus(date)
      if (status === 'overdue' || status === 'soon') {
        vehicleReminders.push({ vehicle: v, type: l, date, status, days: daysUntil(date) })
      }
    })
  })
  vehicleReminders.sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))

  // ── Driver reminders ────────────────────────────────────────────────────────
  const driverReminders: DriverReminderItem[] = []
  drivers.filter(d => d.active).forEach(d => {
    DRIVER_CHECKS.forEach(({ k, l }) => {
      const date   = d[k as keyof typeof d] as string
      const status = reminderStatus(date)
      if (status === 'overdue' || status === 'soon') {
        driverReminders.push({ driver: d, type: l, date, status, days: daysUntil(date) })
      }
    })
  })
  driverReminders.sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))

  const totalAlerts = vehicleReminders.filter(r => r.status === 'overdue').length
                    + driverReminders.filter(r => r.status === 'overdue').length

  // ── Expense chart ───────────────────────────────────────────────────────────
  const catTotals  = groupByCategory(expenses.map(e => ({ category: e.category, amount: e.amount })))
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
  const maxCat     = sortedCats[0]?.[1] || 1
  const chartItems = sortedCats.map(([label, value]) => ({ label, value, formatted: fmt(value) }))

  // ── Per-vehicle summary ─────────────────────────────────────────────────────
  const vehicleSummaries = vehicles.map(v => {
    const dep    = calcDepreciation(v.purchase_price, parseInt(String(v.current_mileage)) || 0, v.condition)
    const vExp   = sumAll(expenses.filter(e => e.vehicle_id === v.id).map(e => ({ amount: e.amount })))
    const vInc   = sumAll(income.filter(i  => i.vehicle_id === v.id).map(i => ({ amount: i.amount })))
    const driver = drivers.find(d => d.assigned_vehicle_id === v.id)
    const nextDue = [
      { d: v.mot_expiry, l: 'MOT' }, { d: v.tax_expiry, l: 'Tax' },
      { d: v.insurance_expiry, l: 'Ins' }, { d: v.service_due_date, l: 'Svc' },
    ].filter(r => r.d).sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime())[0]
    return { v, dep, vExp, vInc, driver, nextDue }
  })

  return (
    <div className="p-6 md:p-7 max-w-5xl">
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })}
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Vehicles" value={String(vehicles.length)} sub="in fleet" />
        <StatCard label="Drivers"  value={String(drivers.filter(d => d.active).length)} sub="active" />
        <StatCard label="Monthly income"   value={fmt(monthInc)} />
        <StatCard label="Monthly expenses" value={fmt(monthExp)} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        {/* Fleet value + net */}
        <div className="fm-card">
          <p className="text-[11px] font-semibold text-[#6B6860] uppercase tracking-[0.4px] mb-1">Fleet value</p>
          <p className="text-[22px] font-bold tracking-[-0.5px]">{fmt(totalFleetValue)}</p>
          <p className="text-[12px] text-[#9B9890] mb-4">estimated market value</p>
          <hr className="border-[#E5E3DD] mb-3" />
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B6860]">Net this month</span>
            <span className={`font-semibold ${monthNet >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
              {fmt(monthNet)}
            </span>
          </div>
          <div className="flex justify-between text-[13px] mt-1.5">
            <span className="text-[#6B6860]">Total overdue alerts</span>
            <span className={`font-semibold ${totalAlerts > 0 ? 'text-[#991B1B]' : 'text-[#166534]'}`}>
              {totalAlerts}
            </span>
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="fm-card md:col-span-2">
          <p className="text-[13px] font-semibold mb-3">Expenses by category</p>
          {chartItems.length === 0
            ? <p className="text-[12px] text-[#9B9890]">No expenses recorded yet</p>
            : <SimpleBarChart items={chartItems} max={maxCat} />
          }
        </div>
      </div>

      {/* Reminders panel — vehicles + drivers combined */}
      {(vehicleReminders.length > 0 || driverReminders.length > 0) && (
        <div className="fm-card mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold">Upcoming & overdue reminders</p>
            <button className="text-[12px] text-[#2563EB] hover:underline" onClick={() => navigate('/reminders')}>
              View all →
            </button>
          </div>

          {/* Vehicle reminders */}
          {vehicleReminders.slice(0, 3).map((r, i) => (
            <div key={`v${i}`} className="flex items-center justify-between py-2.5 border-b border-[#E5E3DD] last:border-b-0">
              <div>
                <p className="text-[13px] font-medium">
                  <RegPill reg={r.vehicle.registration} /> — {r.type}
                </p>
                <p className="text-[12px] text-[#9B9890]">{reminderLabel(r.date)}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}

          {/* Driver reminders */}
          {driverReminders.slice(0, 3).map((r, i) => (
            <div key={`d${i}`} className="flex items-center justify-between py-2.5 border-b border-[#E5E3DD] last:border-b-0">
              <div>
                <p className="text-[13px] font-medium">
                  👤 {r.driver.first_name} {r.driver.last_name} — {r.type}
                </p>
                <p className="text-[12px] text-[#9B9890]">{reminderLabel(r.date)}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}

      {/* Vehicle summary table */}
      <div className="fm-card">
        <p className="text-[13px] font-semibold mb-3">Vehicle summary</p>
        {vehicles.length === 0 ? (
          <div className="text-center py-8 text-[#9B9890] text-[13px]">
            <p className="text-3xl mb-2">🚐</p>
            <p>No vehicles yet.</p>
            <button className="btn btn-primary mt-3" onClick={() => navigate('/vehicles')}>
              Add your first vehicle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fm-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Mileage</th>
                  <th>Est. value</th>
                  <th>Next due</th>
                  <th>Expenses</th>
                  <th>Income</th>
                </tr>
              </thead>
              <tbody>
                {vehicleSummaries.map(({ v, dep, vExp, vInc, driver, nextDue }) => (
                  <tr key={v.id} className="cursor-pointer" onClick={() => navigate('/vehicles')}>
                    <td>
                      <RegPill reg={v.registration} />
                      <span className="text-[11px] text-[#9B9890] ml-1.5">{v.make} {v.model}</span>
                    </td>
                    <td className="text-[12px]">
                      {driver
                        ? <span className="font-medium">{driver.first_name} {driver.last_name}</span>
                        : <span className="text-[#9B9890]">Unassigned</span>
                      }
                    </td>
                    <td>{fmtNum(parseInt(String(v.current_mileage)) || 0)}</td>
                    <td>{fmt(dep.currentValue)}</td>
                    <td>
                      {nextDue
                        ? <span className="flex items-center gap-1.5">
                            <span className="text-[12px] text-[#6B6860]">{nextDue.l}</span>
                            <StatusBadge status={reminderStatus(nextDue.d)} />
                          </span>
                        : '—'}
                    </td>
                    <td className="text-[#991B1B] font-semibold">{fmt(vExp)}</td>
                    <td className="text-[#166534] font-semibold">{fmt(vInc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
