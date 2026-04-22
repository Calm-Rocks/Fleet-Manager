import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { reminderStatus, daysUntil, formatDate } from '../utils'
import { PageHeader, StatusBadge, RegPill, Empty } from '../components/UI'
import type { ReminderItem, DriverReminderItem, ReminderStatus } from '../types'

const VEHICLE_CHECKS = [
  { k: 'mot_expiry',        l: 'MOT'       },
  { k: 'tax_expiry',        l: 'Tax'        },
  { k: 'insurance_expiry',  l: 'Insurance'  },
  { k: 'service_due_date',  l: 'Service'    },
]

const DRIVER_CHECKS = [
  { k: 'licence_expiry',    l: 'Licence'    },
  { k: 'medical_expiry',    l: 'Medical'    },
  { k: 'cpc_expiry',        l: 'CPC'        },
  { k: 'tacho_card_expiry', l: 'Tacho card' },
]

// ── Section component ─────────────────────────────────────────────────────────
function VehicleSection({ title, badgeClass, items }: { title: string; badgeClass: string; items: ReminderItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5 mb-2">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <span className={`badge ${badgeClass}`}>{items.length}</span>
      </div>
      <div className="fm-table-wrap overflow-x-auto">
        <table className="fm-table" style={{ minWidth: 440 }}>
          <thead><tr><th>Vehicle</th><th>Check</th><th>Due date</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i}>
                <td>
                  <RegPill reg={r.vehicle.registration} />
                  <span className="text-[12px] text-[#9B9890] ml-2">{r.vehicle.make} {r.vehicle.model}</span>
                </td>
                <td>{r.type}</td>
                <td className="text-[12px]">{r.date ? formatDate(r.date) : 'Not set'}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DriverSection({ title, badgeClass, items }: { title: string; badgeClass: string; items: DriverReminderItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5 mb-2">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <span className={`badge ${badgeClass}`}>{items.length}</span>
      </div>
      <div className="fm-table-wrap overflow-x-auto">
        <table className="fm-table" style={{ minWidth: 440 }}>
          <thead><tr><th>Driver</th><th>Check</th><th>Due date</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i}>
                <td className="font-medium">{r.driver.first_name} {r.driver.last_name}</td>
                <td>{r.type}</td>
                <td className="text-[12px]">{r.date ? formatDate(r.date) : 'Not set'}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Group helper ──────────────────────────────────────────────────────────────
function groupByStatus<T extends { status: ReminderStatus }>(items: T[]) {
  return {
    overdue: items.filter(i => i.status === 'overdue'),
    soon:    items.filter(i => i.status === 'soon'),
    ok:      items.filter(i => i.status === 'ok'),
    unknown: items.filter(i => i.status === 'unknown'),
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Reminders() {
  const { vehicles, drivers } = useApp()
  const [tab, setTab] = useState<'all' | 'vehicles' | 'drivers'>('all')

  // Build vehicle reminder items
  const vehicleItems: ReminderItem[] = []
  vehicles.forEach(v => {
    VEHICLE_CHECKS.forEach(({ k, l }) => {
      const date = v[k as keyof typeof v] as string
      vehicleItems.push({ vehicle: v, type: l, date, status: reminderStatus(date), days: daysUntil(date) })
    })
  })
  vehicleItems.sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))
  const vGroups = groupByStatus(vehicleItems)

  // Build driver reminder items
  const driverItems: DriverReminderItem[] = []
  drivers.filter(d => d.active).forEach(d => {
    DRIVER_CHECKS.forEach(({ k, l }) => {
      const date = d[k as keyof typeof d] as string
      driverItems.push({ driver: d, type: l, date, status: reminderStatus(date), days: daysUntil(date) })
    })
  })
  driverItems.sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))
  const dGroups = groupByStatus(driverItems)

  const totalOverdue = vGroups.overdue.length + dGroups.overdue.length
  const totalSoon    = vGroups.soon.length    + dGroups.soon.length

  const subtitle = totalOverdue > 0
    ? `${totalOverdue} overdue item${totalOverdue > 1 ? 's' : ''} — action required`
    : totalSoon > 0
    ? `${totalSoon} item${totalSoon > 1 ? 's' : ''} due within 30 days`
    : 'All compliance up to date'

  const showVehicles = tab === 'all' || tab === 'vehicles'
  const showDrivers  = tab === 'all' || tab === 'drivers'

  return (
    <div className="p-6 md:p-7 max-w-4xl">
      <PageHeader title="Reminders" subtitle={subtitle} />

      {/* Tab filter */}
      <div className="flex gap-1 bg-[#F2F0EC] p-1 rounded-xl mb-5 w-fit">
        {([['all', 'All'], ['vehicles', 'Vehicles'], ['drivers', 'Drivers']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              tab === id ? 'bg-white text-[#1A1916] shadow-sm' : 'text-[#6B6860] hover:text-[#1A1916]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {vehicles.length === 0 && drivers.length === 0 ? (
        <Empty icon="⏰" message="Add vehicles and drivers to track compliance reminders." />
      ) : (
        <>
          {/* Overdue */}
          {(showVehicles && vGroups.overdue.length > 0) || (showDrivers && dGroups.overdue.length > 0) ? (
            <div className="mb-6">
              <h2 className="text-[14px] font-semibold text-[#991B1B] mb-3">Overdue</h2>
              {showVehicles && <VehicleSection title="Vehicles" badgeClass="badge-danger" items={vGroups.overdue} />}
              {showDrivers  && <DriverSection  title="Drivers"  badgeClass="badge-danger" items={dGroups.overdue} />}
            </div>
          ) : null}

          {/* Due soon */}
          {(showVehicles && vGroups.soon.length > 0) || (showDrivers && dGroups.soon.length > 0) ? (
            <div className="mb-6">
              <h2 className="text-[14px] font-semibold text-[#92400E] mb-3">Due soon (within 30 days)</h2>
              {showVehicles && <VehicleSection title="Vehicles" badgeClass="badge-soon" items={vGroups.soon} />}
              {showDrivers  && <DriverSection  title="Drivers"  badgeClass="badge-soon" items={dGroups.soon} />}
            </div>
          ) : null}

          {/* OK */}
          {(showVehicles && vGroups.ok.length > 0) || (showDrivers && dGroups.ok.length > 0) ? (
            <div className="mb-6">
              <h2 className="text-[14px] font-semibold text-[#166534] mb-3">OK</h2>
              {showVehicles && <VehicleSection title="Vehicles" badgeClass="badge-ok" items={vGroups.ok} />}
              {showDrivers  && <DriverSection  title="Drivers"  badgeClass="badge-ok" items={dGroups.ok} />}
            </div>
          ) : null}

          {/* Not set */}
          {(showVehicles && vGroups.unknown.length > 0) || (showDrivers && dGroups.unknown.length > 0) ? (
            <div className="mb-6">
              <h2 className="text-[14px] font-semibold text-[#6B6860] mb-3">Not set</h2>
              {showVehicles && <VehicleSection title="Vehicles" badgeClass="badge-gray" items={vGroups.unknown} />}
              {showDrivers  && <DriverSection  title="Drivers"  badgeClass="badge-gray" items={dGroups.unknown} />}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
