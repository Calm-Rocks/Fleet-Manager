import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { fmt, formatDate, sumAll } from '../utils'
import { PageHeader, Empty, RegPill, Spinner } from '../components/UI'
import { IncomeModal } from '../components/EntryModals'

export default function IncomePage() {
  const { vehicles, income, loading, addIncome, deleteIncome } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [filterVehicle, setFilterVehicle] = useState('all')

  const getVehicle = (id: string) => vehicles.find(v => v.id === id)

  const sorted = [...income].sort((a, b) => b.date.localeCompare(a.date))
  const filtered = filterVehicle === 'all'
    ? sorted
    : sorted.filter(i => i.vehicle_id === filterVehicle)

  const total = sumAll(filtered.map(i => ({ amount: i.amount })))

  if (loading) return <Spinner />

  return (
    <div className="p-6 md:p-7 max-w-4xl">
      <PageHeader
        title="Income"
        subtitle={`Total: ${fmt(total)}`}
        action={
          <button
            className="btn btn-primary"
            disabled={vehicles.length === 0}
            onClick={() => setShowForm(true)}
          >
            + Log income
          </button>
        }
      />

      {vehicles.length > 1 && (
        <div className="mb-4">
          <select
            className="fm-input"
            style={{ width: 240 }}
            value={filterVehicle}
            onChange={e => setFilterVehicle(e.target.value)}
          >
            <option value="all">All vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.registration} – {v.make} {v.model}</option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty icon="💷" message="No income logged yet. Track your revenue per vehicle." />
      ) : (
        <div className="fm-table-wrap overflow-x-auto">
          <table className="fm-table" style={{ minWidth: 500 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const v = getVehicle(i.vehicle_id)
                return (
                  <tr key={i.id}>
                    <td>{formatDate(i.date)}</td>
                    <td>{v ? <RegPill reg={v.registration} /> : '—'}</td>
                    <td>{i.source}</td>
                    <td className="font-semibold text-[#166534]">{fmt(parseFloat(String(i.amount)))}</td>
                    <td className="text-[#6B6860]">{i.notes || '—'}</td>
                    <td>
                      <button
                        className="text-[11px] text-[#9B9890] hover:text-[#991B1B] transition-colors"
                        onClick={() => deleteIncome(i.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <IncomeModal
          vehicles={vehicles}
          onClose={() => setShowForm(false)}
          onSave={async i => { await addIncome(i); setShowForm(false) }}
        />
      )}
    </div>
  )
}
