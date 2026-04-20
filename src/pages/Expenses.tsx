import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { fmt, formatDate, groupByCategory, sumAll } from '../utils'
import { PageHeader, Empty, CategoryTag, RegPill, SimpleBarChart, Spinner } from '../components/UI'
import { ExpenseModal } from '../components/EntryModals'

export default function ExpensesPage() {
  const { vehicles, expenses, loading, addExpense, deleteExpense } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [filterVehicle, setFilterVehicle] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const getVehicle = (id: string) => vehicles.find(v => v.id === id)

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date))
  const filtered = sorted
    .filter(e => filterVehicle === 'all' || e.vehicle_id === filterVehicle)
    .filter(e => filterCategory === 'all' || e.category === filterCategory)

  const total = sumAll(filtered.map(e => ({ amount: e.amount })))

  const catTotals = groupByCategory(filtered.map(e => ({ category: e.category, amount: e.amount })))
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
  const maxCat = sortedCats[0]?.[1] || 1

  const categories = [...new Set(expenses.map(e => e.category))]

  if (loading) return <Spinner />

  return (
    <div className="p-6 md:p-7 max-w-4xl">
      <PageHeader
        title="Expenses"
        subtitle={`Total: ${fmt(total)}`}
        action={
          <button
            className="btn btn-primary"
            disabled={vehicles.length === 0}
            onClick={() => setShowForm(true)}
          >
            + Log expense
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {vehicles.length > 1 && (
          <select
            className="fm-input"
            style={{ width: 220 }}
            value={filterVehicle}
            onChange={e => setFilterVehicle(e.target.value)}
          >
            <option value="all">All vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.registration} – {v.make} {v.model}</option>
            ))}
          </select>
        )}
        {categories.length > 1 && (
          <select
            className="fm-input"
            style={{ width: 180 }}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Category breakdown */}
      {sortedCats.length > 0 && (
        <div className="fm-card mb-5">
          <p className="text-[13px] font-semibold mb-3">Breakdown by category</p>
          <SimpleBarChart
            items={sortedCats.map(([label, value]) => ({ label, value, formatted: fmt(value) }))}
            max={maxCat}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty icon="📋" message="No expenses logged yet." />
      ) : (
        <div className="fm-table-wrap overflow-x-auto">
          <table className="fm-table" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const v = getVehicle(e.vehicle_id)
                return (
                  <tr key={e.id}>
                    <td>{formatDate(e.date)}</td>
                    <td>{v ? <RegPill reg={v.registration} /> : '—'}</td>
                    <td><CategoryTag label={e.category} /></td>
                    <td className="font-semibold">{fmt(parseFloat(String(e.amount)))}</td>
                    <td className="text-[#6B6860]">{e.notes || '—'}</td>
                    <td>
                      <button
                        className="text-[11px] text-[#9B9890] hover:text-[#991B1B] transition-colors"
                        onClick={() => deleteExpense(e.id)}
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
        <ExpenseModal
          vehicles={vehicles}
          onClose={() => setShowForm(false)}
          onSave={async e => { await addExpense(e); setShowForm(false) }}
        />
      )}
    </div>
  )
}
