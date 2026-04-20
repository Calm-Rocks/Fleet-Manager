import React from 'react'
import type { Vehicle, ExpenseEntry, IncomeEntry, MileageEntry } from '../types'
import {
  fmt, fmtNum, formatDate, calcDepreciation, reminderStatus, sumAll,
} from '../utils'
import {
  StatusBadge, ReminderRow, StatRow, StatCard, CategoryTag,
} from './UI'

interface Props {
  vehicle: Vehicle
  expenses: ExpenseEntry[]
  income: IncomeEntry[]
  mileage: MileageEntry[]
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export const VehicleDetail: React.FC<Props> = ({
  vehicle, expenses, income, mileage, onBack, onEdit, onDelete,
}) => {
  const dep = calcDepreciation(vehicle.purchase_price, parseInt(String(vehicle.current_mileage)) || 0, vehicle.condition)
  const totalExp = sumAll(expenses.filter(e => e.vehicle_id === vehicle.id))
  const totalInc = sumAll(income.filter(i => i.vehicle_id === vehicle.id))
  const net = totalInc - totalExp

  const vExp  = [...expenses.filter(e => e.vehicle_id === vehicle.id)].sort((a, b) => b.date.localeCompare(a.date))
  const vInc  = [...income.filter(i  => i.vehicle_id === vehicle.id)].sort((a, b) => b.date.localeCompare(a.date))
  const vMil  = [...mileage.filter(m  => m.vehicle_id === vehicle.id)].sort((a, b) => b.date.localeCompare(a.date))

  const reminders = [
    { label: 'MOT',       date: vehicle.mot_expiry },
    { label: 'Tax',       date: vehicle.tax_expiry },
    { label: 'Insurance', date: vehicle.insurance_expiry },
    { label: 'Service',   date: vehicle.service_due_date },
  ]

  const worstStatus = (() => {
    const statuses = reminders.map(r => reminderStatus(r.date))
    if (statuses.includes('overdue')) return 'overdue'
    if (statuses.includes('soon'))    return 'soon'
    return 'ok'
  })()

  return (
    <div className="p-6 md:p-7 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button className="btn btn-secondary btn-sm mt-0.5" onClick={onBack}>← Back</button>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-[20px] font-bold tracking-widest text-[#1A3A5C]">
              {vehicle.registration}
            </span>
            <StatusBadge status={worstStatus} />
            <span className="badge badge-gray">{vehicle.condition}</span>
          </div>
          <p className="text-[13px] text-[#6B6860] mt-0.5">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
        <StatCard label="Est. value" value={fmt(dep.currentValue)} />
        <StatCard
          label="Depreciation"
          value={fmt(dep.depreciation)}
          sub={`${dep.pct}% of purchase`}
          valueColor="#991B1B"
        />
        <StatCard
          label="Mileage"
          value={fmtNum(parseInt(String(vehicle.current_mileage)) || 0)}
          sub="miles"
        />
        <StatCard
          label="Net P&L"
          value={fmt(net)}
          valueColor={net >= 0 ? '#166534' : '#991B1B'}
        />
      </div>

      {/* Two column detail */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Compliance */}
        <div className="fm-card">
          <p className="text-[11px] font-semibold text-[#6B6860] uppercase tracking-[0.4px] mb-3">
            Compliance reminders
          </p>
          {reminders.map(r => (
            <ReminderRow key={r.label} label={r.label} date={r.date} />
          ))}
        </div>

        {/* Financials */}
        <div className="fm-card">
          <p className="text-[11px] font-semibold text-[#6B6860] uppercase tracking-[0.4px] mb-3">
            Financials
          </p>
          <StatRow label="Total income"   value={fmt(totalInc)} valueClass="text-[#166534]" />
          <StatRow label="Total expenses" value={fmt(totalExp)} valueClass="text-[#991B1B]" />
          <StatRow
            label="Net profit"
            value={fmt(net)}
            valueClass={net >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'}
          />
          <StatRow label="Purchase price"  value={fmt(parseFloat(String(vehicle.purchase_price)) || 0)} />
          <StatRow label="Est. market value" value={fmt(dep.currentValue)} />
        </div>
      </div>

      {/* Mileage history */}
      {vMil.length > 0 && (
        <div className="fm-card mb-4">
          <p className="text-[13px] font-semibold mb-3">Mileage history</p>
          <div className="fm-table-wrap overflow-x-auto">
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Date</th><th>Start</th><th>End</th><th>Miles</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {vMil.map(m => (
                  <tr key={m.id}>
                    <td>{formatDate(m.date)}</td>
                    <td>{fmtNum(parseInt(String(m.start_mileage)))}</td>
                    <td>{fmtNum(parseInt(String(m.end_mileage)))}</td>
                    <td className="font-semibold">{fmtNum(parseInt(String(m.total_mileage)))}</td>
                    <td className="text-[#6B6860]">{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense history */}
      {vExp.length > 0 && (
        <div className="fm-card mb-4">
          <p className="text-[13px] font-semibold mb-3">Expense history</p>
          <div className="fm-table-wrap overflow-x-auto">
            <table className="fm-table">
              <thead>
                <tr><th>Date</th><th>Category</th><th>Amount</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {vExp.map(e => (
                  <tr key={e.id}>
                    <td>{formatDate(e.date)}</td>
                    <td><CategoryTag label={e.category} /></td>
                    <td className="font-semibold">{fmt(parseFloat(String(e.amount)))}</td>
                    <td className="text-[#6B6860]">{e.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Income history */}
      {vInc.length > 0 && (
        <div className="fm-card">
          <p className="text-[13px] font-semibold mb-3">Income history</p>
          <div className="fm-table-wrap overflow-x-auto">
            <table className="fm-table">
              <thead>
                <tr><th>Date</th><th>Source</th><th>Amount</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {vInc.map(i => (
                  <tr key={i.id}>
                    <td>{formatDate(i.date)}</td>
                    <td>{i.source}</td>
                    <td className="font-semibold text-[#166534]">{fmt(parseFloat(String(i.amount)))}</td>
                    <td className="text-[#6B6860]">{i.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
