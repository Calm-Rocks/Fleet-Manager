import React from 'react'
import { useApp } from '../hooks/useApp'
import { reminderStatus, daysUntil, formatDate } from '../utils'
import { PageHeader, StatusBadge, RegPill, Empty } from '../components/UI'
import type { ReminderItem } from '../types'

const CHECKS = [
  { k: 'mot_expiry',       l: 'MOT'       },
  { k: 'tax_expiry',       l: 'Tax'        },
  { k: 'insurance_expiry', l: 'Insurance'  },
  { k: 'service_due_date', l: 'Service'    },
]

interface SectionProps {
  title: string
  badgeClass: string
  items: ReminderItem[]
}

const Section: React.FC<SectionProps> = ({ title, badgeClass, items }) => {
  if (items.length === 0) return null
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        <span className={`badge ${badgeClass}`}>{items.length}</span>
      </div>
      <div className="fm-table-wrap overflow-x-auto">
        <table className="fm-table" style={{ minWidth: 480 }}>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Check</th>
              <th>Due date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i}>
                <td>
                  <RegPill reg={r.vehicle.registration} />
                  <span className="text-[12px] text-[#9B9890] ml-2">
                    {r.vehicle.make} {r.vehicle.model}
                  </span>
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

export default function Reminders() {
  const { vehicles } = useApp()

  const items: ReminderItem[] = []
  vehicles.forEach(v => {
    CHECKS.forEach(({ k, l }) => {
      const date = v[k as keyof typeof v] as string
      const status = reminderStatus(date)
      items.push({ vehicle: v, type: l, date, status, days: daysUntil(date) })
    })
  })
  items.sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))

  const groups = {
    overdue: items.filter(i => i.status === 'overdue'),
    soon:    items.filter(i => i.status === 'soon'),
    ok:      items.filter(i => i.status === 'ok'),
    unknown: items.filter(i => i.status === 'unknown'),
  }

  const overdueCount = groups.overdue.length
  const soonCount    = groups.soon.length

  return (
    <div className="p-6 md:p-7 max-w-4xl">
      <PageHeader
        title="Reminders"
        subtitle={
          overdueCount > 0
            ? `${overdueCount} overdue item${overdueCount > 1 ? 's' : ''} — action required`
            : soonCount > 0
            ? `${soonCount} item${soonCount > 1 ? 's' : ''} due within 30 days`
            : 'All compliance up to date'
        }
      />

      {vehicles.length === 0 ? (
        <Empty icon="⏰" message="No vehicles to track. Add vehicles to see compliance reminders." />
      ) : (
        <>
          <Section title="Overdue"                   badgeClass="badge-danger" items={groups.overdue} />
          <Section title="Due soon (within 30 days)" badgeClass="badge-soon"   items={groups.soon} />
          <Section title="OK"                        badgeClass="badge-ok"     items={groups.ok} />
          <Section title="Not set"                   badgeClass="badge-gray"   items={groups.unknown} />
        </>
      )}
    </div>
  )
}
