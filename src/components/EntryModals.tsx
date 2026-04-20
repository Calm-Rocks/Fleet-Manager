import React, { useState } from 'react'
import type { Vehicle, ExpenseEntry, IncomeEntry, MileageEntry } from '../types'
import { uid, todayIso, EXPENSE_CATEGORIES } from '../utils'
import { Modal, FormGroup, FormRow } from './UI'

// ─── Expense Modal ────────────────────────────────────────────────────────────
interface ExpenseProps {
  vehicles: Vehicle[]
  onSave: (e: ExpenseEntry) => void
  onClose: () => void
}
export const ExpenseModal: React.FC<ExpenseProps> = ({ vehicles, onSave, onClose }) => {
  const [form, setForm] = useState<Omit<ExpenseEntry, 'id'>>({
    vehicle_id: vehicles[0]?.id || '',
    date: todayIso(),
    category: 'Fuel',
    amount: '',
    notes: '',
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const valid = form.vehicle_id && form.date && form.amount

  return (
    <Modal
      title="Log expense"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ ...form, id: uid() })}>
            Save expense
          </button>
        </>
      }
    >
      <FormRow>
        <FormGroup label="Vehicle">
          <select className="fm-input" value={form.vehicle_id} onChange={set('vehicle_id')}>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.registration} – {v.make} {v.model}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Date">
          <input className="fm-input" type="date" value={form.date} onChange={set('date')} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Category">
          <select className="fm-input" value={form.category} onChange={set('category')}>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Amount (£)">
          <input className="fm-input" type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
        </FormGroup>
      </FormRow>
      <FormGroup label="Notes">
        <input className="fm-input" value={form.notes} onChange={set('notes')} placeholder="Optional notes" />
      </FormGroup>
    </Modal>
  )
}

// ─── Income Modal ─────────────────────────────────────────────────────────────
interface IncomeProps {
  vehicles: Vehicle[]
  onSave: (i: IncomeEntry) => void
  onClose: () => void
}
export const IncomeModal: React.FC<IncomeProps> = ({ vehicles, onSave, onClose }) => {
  const [form, setForm] = useState<Omit<IncomeEntry, 'id'>>({
    vehicle_id: vehicles[0]?.id || '',
    date: todayIso(),
    source: '',
    amount: '',
    notes: '',
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const valid = form.vehicle_id && form.date && form.source && form.amount

  return (
    <Modal
      title="Log income"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ ...form, id: uid() })}>
            Save income
          </button>
        </>
      }
    >
      <FormRow>
        <FormGroup label="Vehicle">
          <select className="fm-input" value={form.vehicle_id} onChange={set('vehicle_id')}>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.registration} – {v.make} {v.model}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Date">
          <input className="fm-input" type="date" value={form.date} onChange={set('date')} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Income source">
          <input className="fm-input" value={form.source} onChange={set('source')} placeholder="e.g. Delivery contract" />
        </FormGroup>
        <FormGroup label="Amount (£)">
          <input className="fm-input" type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
        </FormGroup>
      </FormRow>
      <FormGroup label="Notes">
        <input className="fm-input" value={form.notes} onChange={set('notes')} placeholder="Optional notes" />
      </FormGroup>
    </Modal>
  )
}

// ─── Mileage Modal ────────────────────────────────────────────────────────────
interface MileageProps {
  vehicles: Vehicle[]
  onSave: (m: MileageEntry) => void
  onClose: () => void
}
export const MileageModal: React.FC<MileageProps> = ({ vehicles, onSave, onClose }) => {
  const [form, setForm] = useState<Omit<MileageEntry, 'id' | 'total_mileage'>>({
    vehicle_id: vehicles[0]?.id || '',
    date: todayIso(),
    start_mileage: '',
    end_mileage: '',
    notes: '',
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const start = parseInt(String(form.start_mileage)) || 0
  const end   = parseInt(String(form.end_mileage))   || 0
  const total = end > start ? end - start : 0
  const valid = form.vehicle_id && form.date && form.start_mileage && form.end_mileage && end >= start

  return (
    <Modal
      title="Log mileage"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => onSave({ ...form, id: uid(), total_mileage: total })}
          >
            Save mileage
          </button>
        </>
      }
    >
      <FormRow>
        <FormGroup label="Vehicle">
          <select className="fm-input" value={form.vehicle_id} onChange={set('vehicle_id')}>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.registration} – {v.make} {v.model}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Date">
          <input className="fm-input" type="date" value={form.date} onChange={set('date')} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Start mileage">
          <input className="fm-input" type="number" value={form.start_mileage} onChange={set('start_mileage')} />
        </FormGroup>
        <FormGroup label="End mileage">
          <input className="fm-input" type="number" value={form.end_mileage} onChange={set('end_mileage')} />
        </FormGroup>
      </FormRow>
      {total > 0 && (
        <div className="px-3 py-2 bg-[#EBF2FC] rounded-lg text-[13px] font-semibold text-[#2563EB] mb-3">
          Total distance: {total.toLocaleString('en-GB')} miles
        </div>
      )}
      <FormGroup label="Notes">
        <input className="fm-input" value={form.notes} onChange={set('notes')} placeholder="Optional notes" />
      </FormGroup>
    </Modal>
  )
}
