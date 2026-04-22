import React, { useState } from 'react'
import type { Vehicle } from '../types'
import { uid, CONDITIONS } from '../utils'
import { Modal, FormGroup, FormRow, Divider } from './UI'
import { useDvlaLookup } from '../hooks/useDvlaLookup'

interface Props {
  vehicle?: Vehicle | null
  onSave: (v: Vehicle) => void
  onClose: () => void
}

const empty: Omit<Vehicle, 'id'> = {
  registration: '',
  make: '',
  model: '',
  year: '',
  current_mileage: '',
  condition: 'Good',
  purchase_price: '',
  mot_expiry: '',
  tax_expiry: '',
  insurance_expiry: '',
  service_due_date: '',
}

// ── UK reg plate → first MOT due date ────────────────────────────────────────
// Current UK format (since 2001): AB51 CDE
//   Chars 3-4 = age identifier number
//   01–50 → registered in March of that year  (e.g. 23 = March 2023)
//   51–99 → registered in September           (e.g. 73 = September 2023)
// First MOT is due 3 years after first registration.
// Returns ISO date string or null if reg format not recognised.

function calcMotExpiryFromReg(reg: string): string | null {
  try {
    const clean = reg.replace(/\s+/g, '').toUpperCase()

    // Must be 7 chars and match current plate format: 2 letters, 2 digits, 3 letters
    if (!/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(clean)) return null

    const ageId = parseInt(clean.slice(2, 4), 10)
    if (isNaN(ageId)) return null

    let year: number
    let month: number // 1-based

    if (ageId >= 1 && ageId <= 50) {
      // March registration — e.g. 23 = March 2023
      year  = 2000 + ageId
      month = 3
    } else if (ageId >= 51 && ageId <= 99) {
      // September registration — e.g. 73 = September 2023
      year  = 2000 + (ageId - 50)
      month = 9
    } else {
      return null
    }

    // First MOT due exactly 3 years after first registration month
    const motYear  = year + 3
    const motMonth = String(month).padStart(2, '0')
    const lastDay  = new Date(motYear, month, 0).getDate() // last day of that month
    return `${motYear}-${motMonth}-${lastDay}`
  } catch {
    return null
  }
}

export const VehicleModal: React.FC<Props> = ({ vehicle, onSave, onClose }) => {
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>(vehicle ? { ...vehicle } : { ...empty })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dvlaApplied, setDvlaApplied] = useState(false)
  const [motCalculated, setMotCalculated] = useState(false)
  const { lookup, loading: dvlaLoading, result: dvlaResult } = useDvlaLookup()

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  // ── DVLA lookup ────────────────────────────────────────────────────────────
  const handleDvlaLookup = async () => {
    if (!form.registration.trim()) {
      setErrors(e => ({ ...e, registration: 'Enter a registration first' }))
      return
    }
    setErrors({})
    setMotCalculated(false)
    const res = await lookup(form.registration)

    if (res.success && res.data) {
      const data = res.data
      let motExpiry = data.motExpiryDate || ''
      let motWasCalculated = false

      // If DVLA has no MOT expiry, calculate from reg plate (new vehicle, <3 years)
      if (!motExpiry) {
        const calculated = calcMotExpiryFromReg(data.registration)
        if (calculated) {
          motExpiry = calculated
          motWasCalculated = true
        }
      }

      setForm(f => ({
        ...f,
        registration: data.registration,
        make:         data.make              || f.make,
        year:         data.yearOfManufacture || f.year,
        mot_expiry:   motExpiry              || f.mot_expiry,
        tax_expiry:   data.taxDueDate        || f.tax_expiry,
      }))

      setDvlaApplied(true)
      setMotCalculated(motWasCalculated)
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.registration.trim()) errs.registration = 'Required'
    if (!form.make.trim())         errs.make = 'Required'
    return errs
  }

  const save = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      ...form,
      id: vehicle?.id || uid(),
      registration: form.registration.toUpperCase().replace(/\s+/g, ' ').trim(),
    })
  }

  return (
    <Modal
      title={vehicle ? 'Edit vehicle' : 'Add vehicle'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save vehicle</button>
        </>
      }
    >
      {/* ── DVLA lookup ──────────────────────────────────────────────────── */}
      {!vehicle && (
        <div className="bg-[#F2F0EC] rounded-xl p-3.5 mb-4">
          <p className="text-[12px] font-semibold text-[#1A1916] mb-2">
            🇬🇧 Auto-fill from DVLA
          </p>
          <p className="text-[11px] text-[#6B6860] mb-3">
            Enter a UK registration and we'll look up the make, year, MOT and tax expiry automatically.
          </p>
          <div className="flex gap-2">
            <input
              className="fm-input font-mono font-bold tracking-widest uppercase flex-1"
              value={form.registration}
              onChange={e => {
                setForm(f => ({ ...f, registration: e.target.value }))
                setDvlaApplied(false)
                setMotCalculated(false)
              }}
              placeholder="AB12 CDE"
            />
            <button
              className="btn btn-primary flex-shrink-0"
              onClick={handleDvlaLookup}
              disabled={dvlaLoading}
            >
              {dvlaLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  Looking up…
                </span>
              ) : 'Look up reg'}
            </button>
          </div>

          {/* DVLA result feedback */}
          {dvlaResult && !dvlaResult.success && (
            <p className="text-[12px] text-[#991B1B] mt-2">
              ✗ {dvlaResult.error}
            </p>
          )}
          {dvlaResult?.success && dvlaApplied && (
            <div className="mt-2 text-[12px] text-[#166534] bg-[#F0FDF4] rounded-lg px-3 py-2 border border-[#BBF7D0] space-y-0.5">
              <p>✓ Details filled from DVLA</p>
              {motCalculated && (
                <p className="text-[#6B6860]">
                  MOT not yet recorded by DVLA — estimated first due date calculated from reg plate (3 years from registration). Verify and adjust if needed.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Manual fields ──────────────────────────────────────────────────── */}
      {vehicle && (
        <FormGroup label="Registration">
          <input
            className="fm-input font-mono font-bold tracking-widest uppercase"
            value={form.registration}
            onChange={set('registration')}
          />
        </FormGroup>
      )}

      <FormRow>
        <FormGroup label="Make *">
          <input
            className={`fm-input ${errors.make ? 'border-red-400' : ''}`}
            value={form.make}
            onChange={set('make')}
            placeholder="Ford"
          />
          {errors.make && <p className="text-red-500 text-[11px] mt-1">{errors.make}</p>}
        </FormGroup>
        <FormGroup label="Model">
          <input className="fm-input" value={form.model} onChange={set('model')} placeholder="Transit" />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup label="Year">
          <input className="fm-input" type="number" value={form.year} onChange={set('year')} placeholder="2020" />
        </FormGroup>
        <FormGroup label="Condition">
          <select className="fm-input" value={form.condition} onChange={set('condition')}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup label="Current mileage">
          <input
            className="fm-input"
            type="number"
            value={form.current_mileage}
            onChange={set('current_mileage')}
            placeholder="45000"
          />
        </FormGroup>
        <FormGroup label="Purchase price (£)">
          <input
            className="fm-input"
            type="number"
            value={form.purchase_price}
            onChange={set('purchase_price')}
            placeholder="25000"
          />
        </FormGroup>
      </FormRow>

      <Divider />
      <p className="text-[11px] font-semibold text-[#9B9890] uppercase tracking-[0.5px] mb-3">
        Compliance dates
        {dvlaApplied && (
          <span className="ml-2 text-[#166534] normal-case tracking-normal">
            — {motCalculated ? 'tax from DVLA, MOT estimated from reg plate' : 'MOT & tax from DVLA'}
          </span>
        )}
      </p>

      <FormRow>
        <FormGroup label={`MOT expiry${motCalculated ? ' (estimated)' : ''}`}>
          <input className="fm-input" type="date" value={form.mot_expiry} onChange={set('mot_expiry')} />
        </FormGroup>
        <FormGroup label="Tax expiry">
          <input className="fm-input" type="date" value={form.tax_expiry} onChange={set('tax_expiry')} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Insurance expiry">
          <input className="fm-input" type="date" value={form.insurance_expiry} onChange={set('insurance_expiry')} />
        </FormGroup>
        <FormGroup label="Service due">
          <input className="fm-input" type="date" value={form.service_due_date} onChange={set('service_due_date')} />
        </FormGroup>
      </FormRow>
    </Modal>
  )
}
