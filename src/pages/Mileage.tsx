import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { fmtNum, formatDate } from '../utils'
import { PageHeader, Empty, RegPill, Spinner } from '../components/UI'
import { MileageModal } from '../components/EntryModals'

export default function MileagePage() {
  const { vehicles, mileage, loading, addMileage } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [filterVehicle, setFilterVehicle] = useState('all')

  const getVehicle = (id: string) => vehicles.find(v => v.id === id)

  const sorted = [...mileage].sort((a, b) => b.date.localeCompare(a.date))
  const filtered = filterVehicle === 'all'
    ? sorted
    : sorted.filter(m => m.vehicle_id === filterVehicle)

  const totalMiles = filtered.reduce((s, m) => s + (parseInt(String(m.total_mileage)) || 0), 0)

  if (loading) return <Spinner />

  return (
    <div className="p-6 md:p-7 max-w-4xl">
      <PageHeader
        title="Mileage"
        subtitle={`${filtered.length} log${filtered.length !== 1 ? 's' : ''} · ${fmtNum(totalMiles)} total miles`}
        action={
          <button
            className="btn btn-primary"
            disabled={vehicles.length === 0}
            onClick={() => setShowForm(true)}
          >
            + Log mileage
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
        <Empty icon="📍" message="No mileage logged yet. Start tracking to see history here." />
      ) : (
        <div className="fm-table-wrap overflow-x-auto">
          <table className="fm-table" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Start</th>
                <th>End</th>
                <th>Miles</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const v = getVehicle(m.vehicle_id)
                return (
                  <tr key={m.id}>
                    <td>{formatDate(m.date)}</td>
                    <td>{v ? <RegPill reg={v.registration} /> : '—'}</td>
                    <td>{fmtNum(parseInt(String(m.start_mileage)))}</td>
                    <td>{fmtNum(parseInt(String(m.end_mileage)))}</td>
                    <td className="font-semibold">{fmtNum(parseInt(String(m.total_mileage)))}</td>
                    <td className="text-[#6B6860]">{m.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MileageModal
          vehicles={vehicles}
          onClose={() => setShowForm(false)}
          onSave={async m => { await addMileage(m); setShowForm(false) }}
        />
      )}
    </div>
  )
}
