import { useState } from 'react'
import type { Driver, LicenceCategory } from '../types'
import { uid } from '../utils'
import { Modal, FormGroup, FormRow, Divider } from './UI'

interface Props {
  driver?: Driver | null
  vehicles: { id: string; registration: string; make: string; model: string }[]
  onSave: (d: Driver) => void
  onClose: () => void
}

const ALL_CATEGORIES: LicenceCategory[] = [
  'AM', 'A1', 'A2', 'A',
  'B', 'B1', 'BE',
  'C1', 'C1E', 'C', 'CE',
  'D1', 'D1E', 'D', 'DE',
]

const empty: Omit<Driver, 'id'> = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  licence_number: '',
  licence_categories: [],
  licence_expiry: '',
  licence_points: 0,
  medical_expiry: '',
  cpc_expiry: '',
  tacho_card_expiry: '',
  assigned_vehicle_id: '',
  notes: '',
  active: true,
}

export const DriverModal: React.FC<Props> = ({ driver, vehicles, onSave, onClose }) => {
  const [form, setForm] = useState<Omit<Driver, 'id'>>(driver ? { ...driver } : { ...empty })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const toggleCategory = (cat: LicenceCategory) => {
    setForm(f => {
      const cats = f.licence_categories || []
      return {
        ...f,
        licence_categories: cats.includes(cat)
          ? cats.filter(c => c !== cat)
          : [...cats, cat],
      }
    })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.first_name.trim()) errs.first_name = 'Required'
    if (!form.last_name.trim())  errs.last_name  = 'Required'
    return errs
  }

  const save = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, id: driver?.id || uid() })
  }

  return (
    <Modal
      title={driver ? 'Edit driver' : 'Add driver'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save driver</button>
        </>
      }
    >
      {/* Personal details */}
      <FormRow>
        <FormGroup label="First name *">
          <input
            className={`fm-input ${errors.first_name ? 'border-red-400' : ''}`}
            value={form.first_name}
            onChange={set('first_name')}
            placeholder="James"
          />
          {errors.first_name && <p className="text-red-500 text-[11px] mt-1">{errors.first_name}</p>}
        </FormGroup>
        <FormGroup label="Last name *">
          <input
            className={`fm-input ${errors.last_name ? 'border-red-400' : ''}`}
            value={form.last_name}
            onChange={set('last_name')}
            placeholder="Hartley"
          />
          {errors.last_name && <p className="text-red-500 text-[11px] mt-1">{errors.last_name}</p>}
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Email">
          <input className="fm-input" type="email" value={form.email || ''} onChange={set('email')} placeholder="driver@example.co.uk" />
        </FormGroup>
        <FormGroup label="Phone">
          <input className="fm-input" type="tel" value={form.phone || ''} onChange={set('phone')} placeholder="07700 900000" />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Date of birth">
          <input className="fm-input" type="date" value={form.date_of_birth || ''} onChange={set('date_of_birth')} />
        </FormGroup>
        <FormGroup label="Assigned vehicle">
          <select
            className="fm-input"
            value={form.assigned_vehicle_id || ''}
            onChange={set('assigned_vehicle_id')}
          >
            <option value="">— Unassigned —</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.registration} – {v.make} {v.model}
              </option>
            ))}
          </select>
        </FormGroup>
      </FormRow>

      <Divider />
      <p className="text-[11px] font-semibold text-[#9B9890] uppercase tracking-[0.5px] mb-3">Driving licence</p>

      <FormRow>
        <FormGroup label="Licence number">
          <input
            className="fm-input font-mono tracking-wider uppercase"
            value={form.licence_number || ''}
            onChange={set('licence_number')}
            placeholder="HARTL803140JA9AB"
          />
        </FormGroup>
        <FormGroup label="Licence expiry">
          <input className="fm-input" type="date" value={form.licence_expiry || ''} onChange={set('licence_expiry')} />
        </FormGroup>
      </FormRow>

      <FormGroup label="Penalty points">
        <input
          className="fm-input"
          type="number"
          min="0"
          max="12"
          value={form.licence_points ?? 0}
          onChange={e => setForm(f => ({ ...f, licence_points: parseInt(e.target.value) || 0 }))}
        />
      </FormGroup>

      {/* Licence categories */}
      <FormGroup label="Licence categories">
        <div className="flex flex-wrap gap-2 mt-1">
          {ALL_CATEGORIES.map(cat => {
            const selected = (form.licence_categories || []).includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[12px] font-semibold border transition-all ${
                  selected
                    ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]'
                    : 'bg-white text-[#6B6860] border-[#D0CEC8] hover:border-[#9B9890]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </FormGroup>

      <Divider />
      <p className="text-[11px] font-semibold text-[#9B9890] uppercase tracking-[0.5px] mb-3">Compliance dates</p>

      <FormRow>
        <FormGroup label="Medical expiry">
          <input className="fm-input" type="date" value={form.medical_expiry || ''} onChange={set('medical_expiry')} />
        </FormGroup>
        <FormGroup label="CPC expiry">
          <input className="fm-input" type="date" value={form.cpc_expiry || ''} onChange={set('cpc_expiry')} />
        </FormGroup>
      </FormRow>
      <FormGroup label="Tacho card expiry">
        <input className="fm-input" type="date" value={form.tacho_card_expiry || ''} onChange={set('tacho_card_expiry')} />
      </FormGroup>

      <Divider />

      <FormGroup label="Notes">
        <textarea
          className="fm-input resize-none"
          rows={3}
          value={form.notes || ''}
          onChange={set('notes')}
          placeholder="Any notes about this driver..."
        />
      </FormGroup>

      <div className="flex items-center gap-2.5 mt-1">
        <input
          type="checkbox"
          id="active"
          checked={form.active}
          onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="active" className="text-[13px] font-medium cursor-pointer">
          Active driver
        </label>
      </div>
    </Modal>
  )
}
