import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { calcDepreciation, fmt, fmtNum, reminderStatus } from '../utils'
import { PageHeader, StatusBadge, Empty, Spinner } from '../components/UI'
import { VehicleModal } from '../components/VehicleModal'
import { VehicleDetail } from '../components/VehicleDetail'
import type { Vehicle } from '../types'

export default function Vehicles() {
  const { vehicles, expenses, income, mileage, loading, saveVehicle, deleteVehicle } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)

  const selected = vehicles.find(v => v.id === selectedId)

  const handleEdit = (v: Vehicle) => {
    setEditVehicle(v)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle and all its records? This cannot be undone.')) return
    await deleteVehicle(id)
    setSelectedId(null)
  }

  if (loading) return <Spinner />

  // Show vehicle detail
  if (selected && !showForm) {
    return (
      <>
        <VehicleDetail
          vehicle={selected}
          expenses={expenses}
          income={income}
          mileage={mileage}
          onBack={() => setSelectedId(null)}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected.id)}
        />
        {showForm && (
          <VehicleModal
            vehicle={editVehicle}
            onClose={() => { setShowForm(false); setEditVehicle(null) }}
            onSave={async v => { await saveVehicle(v); setShowForm(false); setEditVehicle(null) }}
          />
        )}
      </>
    )
  }

  return (
    <div className="p-6 md:p-7 max-w-4xl">
      <PageHeader
        title="Vehicles"
        subtitle={`${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} in fleet`}
        action={
          <button
            className="btn btn-primary"
            onClick={() => { setEditVehicle(null); setShowForm(true) }}
          >
            + Add vehicle
          </button>
        }
      />

      {vehicles.length === 0 ? (
        <Empty icon="🚐" message="No vehicles yet. Add your first vehicle to get started." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3.5">
          {vehicles.map(v => {
            const dep = calcDepreciation(
              v.purchase_price,
              parseInt(String(v.current_mileage)) || 0,
              v.condition
            )
            const statuses = ['mot_expiry', 'tax_expiry', 'insurance_expiry', 'service_due_date']
              .map(k => reminderStatus(v[k as keyof typeof v] as string))
            const worst = statuses.includes('overdue')
              ? 'overdue'
              : statuses.includes('soon')
              ? 'soon'
              : 'ok'

            return (
              <button
                key={v.id}
                className="fm-card text-left hover:border-[#D0CEC8] hover:shadow-sm transition-all duration-150 cursor-pointer w-full"
                onClick={() => setSelectedId(v.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-[16px] font-bold tracking-wider text-[#1A3A5C]">
                      {v.registration}
                    </p>
                    <p className="text-[13px] text-[#6B6860] mt-0.5">
                      {v.year} {v.make} {v.model}
                    </p>
                  </div>
                  {worst !== 'ok' && <StatusBadge status={worst} />}
                </div>
                <div className="flex items-center gap-4 text-[12px] text-[#6B6860]">
                  <span>Est. {fmt(dep.currentValue)}</span>
                  <span>{fmtNum(parseInt(String(v.current_mileage)) || 0)} mi</span>
                  <span className="px-1.5 py-0.5 bg-[#F2F0EC] rounded text-[11px] font-medium">
                    {v.condition}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {showForm && (
        <VehicleModal
          vehicle={editVehicle}
          onClose={() => { setShowForm(false); setEditVehicle(null) }}
          onSave={async v => {
            await saveVehicle(v)
            setShowForm(false)
            setEditVehicle(null)
          }}
        />
      )}
    </div>
  )
}
