import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { reminderStatus, formatDate, daysUntil } from '../utils'
import { PageHeader, StatusBadge, Empty, Spinner, StatRow } from '../components/UI'
import { DriverModal } from '../components/DriverModal'
import type { Driver, DriverReminderItem } from '../types'

// ── Driver reminder checks ─────────────────────────────────────────────────────
const DRIVER_CHECKS = [
  { k: 'licence_expiry',    l: 'Licence'    },
  { k: 'medical_expiry',    l: 'Medical'    },
  { k: 'cpc_expiry',        l: 'CPC'        },
  { k: 'tacho_card_expiry', l: 'Tacho card' },
]

function driverWorstStatus(driver: Driver) {
  const statuses = DRIVER_CHECKS.map(c => reminderStatus(driver[c.k as keyof Driver] as string))
  if (statuses.includes('overdue')) return 'overdue'
  if (statuses.includes('soon'))    return 'soon'
  return 'ok'
}

function pointsColor(points: number) {
  if (points >= 9)  return 'text-[#991B1B]'
  if (points >= 6)  return 'text-[#92400E]'
  return 'text-[#166534]'
}

// ── Driver detail view ─────────────────────────────────────────────────────────
function DriverDetail({
  driver,
  vehicle,
  onBack,
  onEdit,
  onDelete,
}: {
  driver: Driver
  vehicle?: { registration: string; make: string; model: string }
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const reminders: DriverReminderItem[] = DRIVER_CHECKS.map(c => ({
    driver,
    type:   c.l,
    date:   driver[c.k as keyof Driver] as string,
    status: reminderStatus(driver[c.k as keyof Driver] as string),
    days:   daysUntil(driver[c.k as keyof Driver] as string),
  }))

  const fullName = `${driver.first_name} ${driver.last_name}`
  const initials = `${driver.first_name[0]}${driver.last_name[0]}`.toUpperCase()

  return (
    <div className="p-6 md:p-7 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button className="btn btn-secondary btn-sm mt-0.5" onClick={onBack}>← Back</button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1A3A5C] flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-semibold tracking-[-0.3px]">{fullName}</h1>
              {!driver.active && <span className="badge badge-gray">Inactive</span>}
              <StatusBadge status={driverWorstStatus(driver)} />
            </div>
            {vehicle && (
              <p className="text-[12px] text-[#6B6860] mt-0.5">
                Assigned to{' '}
                <span className="font-mono font-bold text-[#1A3A5C]">{vehicle.registration}</span>
                {' '}{vehicle.make} {vehicle.model}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Contact */}
        <div className="fm-card">
          <p className="text-[11px] font-semibold text-[#6B6860] uppercase tracking-[0.4px] mb-3">Contact</p>
          <StatRow label="Email"         value={driver.email        || '—'} />
          <StatRow label="Phone"         value={driver.phone        || '—'} />
          <StatRow label="Date of birth" value={driver.date_of_birth ? formatDate(driver.date_of_birth) : '—'} />
        </div>

        {/* Licence */}
        <div className="fm-card">
          <p className="text-[11px] font-semibold text-[#6B6860] uppercase tracking-[0.4px] mb-3">Driving licence</p>
          <StatRow label="Licence number" value={driver.licence_number || '—'} />
          <div className="flex justify-between items-center py-2 border-b border-[#E5E3DD] text-[13px]">
            <span className="text-[#6B6860]">Penalty points</span>
            <span className={`font-bold text-[15px] ${pointsColor(driver.licence_points || 0)}`}>
              {driver.licence_points ?? 0}
            </span>
          </div>
          {(driver.licence_categories || []).length > 0 && (
            <div className="flex justify-between items-center py-2 text-[13px]">
              <span className="text-[#6B6860]">Categories</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {(driver.licence_categories || []).map(c => (
                  <span key={c} className="px-1.5 py-0.5 bg-[#EBF2FC] text-[#185FA5] rounded text-[11px] font-semibold">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compliance reminders */}
      <div className="fm-card mb-4">
        <p className="text-[11px] font-semibold text-[#6B6860] uppercase tracking-[0.4px] mb-3">Compliance reminders</p>
        {reminders.map(r => (
          <div key={r.type} className="flex items-center justify-between py-2.5 border-b border-[#E5E3DD] last:border-b-0">
            <div>
              <p className="text-[13px] font-medium">{r.type}</p>
              <p className="text-[12px] text-[#9B9890]">
                {r.date ? formatDate(r.date) : 'Not set'}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>

      {/* Notes */}
      {driver.notes && (
        <div className="fm-card">
          <p className="text-[11px] font-semibold text-[#6B6860] uppercase tracking-[0.4px] mb-2">Notes</p>
          <p className="text-[13px] text-[#1A1916] leading-relaxed whitespace-pre-wrap">{driver.notes}</p>
        </div>
      )}
    </div>
  )
}

// ── Main Drivers page ──────────────────────────────────────────────────────────
export default function DriversPage() {
  const { drivers, vehicles, loading, saveDriver, deleteDriver } = useApp()
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [showForm,   setShowForm]     = useState(false)
  const [editDriver, setEditDriver]   = useState<Driver | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const selected = drivers.find(d => d.id === selectedId)

  const handleEdit = (d: Driver) => {
    setEditDriver(d)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this driver? This cannot be undone.')) return
    await deleteDriver(id)
    setSelectedId(null)
  }

  if (loading) return <Spinner />

  // Show detail view
  if (selected && !showForm) {
    const assignedVehicle = vehicles.find(v => v.id === selected.assigned_vehicle_id)
    return (
      <>
        <DriverDetail
          driver={selected}
          vehicle={assignedVehicle}
          onBack={() => setSelectedId(null)}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected.id)}
        />
        {showForm && (
          <DriverModal
            driver={editDriver}
            vehicles={vehicles}
            onClose={() => { setShowForm(false); setEditDriver(null) }}
            onSave={async d => { await saveDriver(d); setShowForm(false); setEditDriver(null) }}
          />
        )}
      </>
    )
  }

  const active   = drivers.filter(d => d.active)
  const inactive = drivers.filter(d => !d.active)
  const displayed = showInactive ? drivers : active

  // Summary counts
  const overdueCount = drivers.filter(d => driverWorstStatus(d) === 'overdue').length
  const soonCount    = drivers.filter(d => driverWorstStatus(d) === 'soon').length

  return (
    <div className="p-6 md:p-7 max-w-4xl">
      <PageHeader
        title="Drivers"
        subtitle={`${active.length} active driver${active.length !== 1 ? 's' : ''}${overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}`}
        action={
          <button
            className="btn btn-primary"
            onClick={() => { setEditDriver(null); setShowForm(true) }}
          >
            + Add driver
          </button>
        }
      />

      {/* Alert banner */}
      {(overdueCount > 0 || soonCount > 0) && (
        <div className={`rounded-xl p-3.5 mb-5 flex items-center gap-3 ${
          overdueCount > 0
            ? 'bg-[#FEF2F2] border border-[#FECACA]'
            : 'bg-[#FFFBEB] border border-[#FDE68A]'
        }`}>
          <span className="text-lg">{overdueCount > 0 ? '⚠' : '⏰'}</span>
          <p className="text-[13px]" style={{ color: overdueCount > 0 ? '#991B1B' : '#92400E' }}>
            {overdueCount > 0
              ? `${overdueCount} driver${overdueCount > 1 ? 's have' : ' has'} overdue compliance items — check the Reminders page.`
              : `${soonCount} driver${soonCount > 1 ? 's have' : ' has'} compliance items due within 30 days.`
            }
          </p>
        </div>
      )}

      {displayed.length === 0 ? (
        <Empty icon="👤" message="No drivers yet. Add your first driver to get started." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3.5">
          {displayed.map(driver => {
            const worst   = driverWorstStatus(driver)
            const vehicle = vehicles.find(v => v.id === driver.assigned_vehicle_id)
            const initials = `${driver.first_name[0]}${driver.last_name[0]}`.toUpperCase()

            return (
              <button
                key={driver.id}
                className="fm-card text-left hover:border-[#D0CEC8] hover:shadow-sm transition-all duration-150 w-full"
                onClick={() => setSelectedId(driver.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F2F0EC] flex items-center justify-center text-[13px] font-bold text-[#6B6860] flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <p className="text-[14px] font-semibold truncate">
                        {driver.first_name} {driver.last_name}
                      </p>
                      {worst !== 'ok' && <StatusBadge status={worst} />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#6B6860] flex-wrap">
                      {vehicle ? (
                        <span className="font-mono font-bold text-[#1A3A5C] text-[11px]">
                          {vehicle.registration}
                        </span>
                      ) : (
                        <span className="text-[#9B9890]">Unassigned</span>
                      )}
                      {(driver.licence_categories || []).slice(0, 4).map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-[#EBF2FC] text-[#185FA5] rounded text-[10px] font-semibold">
                          {c}
                        </span>
                      ))}
                      {(driver.licence_points || 0) > 0 && (
                        <span className={`font-semibold ${pointsColor(driver.licence_points || 0)}`}>
                          {driver.licence_points} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {inactive.length > 0 && (
        <button
          className="mt-4 text-[12px] text-[#6B6860] hover:text-[#1A1916] transition-colors"
          onClick={() => setShowInactive(s => !s)}
        >
          {showInactive ? 'Hide' : 'Show'} {inactive.length} inactive driver{inactive.length > 1 ? 's' : ''}
        </button>
      )}

      {showForm && (
        <DriverModal
          driver={editDriver}
          vehicles={vehicles}
          onClose={() => { setShowForm(false); setEditDriver(null) }}
          onSave={async d => {
            await saveDriver(d)
            setShowForm(false)
            setEditDriver(null)
          }}
        />
      )}
    </div>
  )
}
