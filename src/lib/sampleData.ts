import type { Vehicle, ExpenseEntry, IncomeEntry, MileageEntry } from '../types'

export const SAMPLE_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    registration: 'LK23 ABX',
    make: 'Ford',
    model: 'Transit',
    year: 2023,
    current_mileage: 34500,
    condition: 'Good',
    purchase_price: 28000,
    mot_expiry: '2026-03-15',
    tax_expiry: '2025-05-01',
    insurance_expiry: '2026-01-10',
    service_due_date: '2025-06-20',
  },
  {
    id: 'v2',
    registration: 'YR71 CDT',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2021,
    current_mileage: 78200,
    condition: 'Fair',
    purchase_price: 35000,
    mot_expiry: '2025-09-22',
    tax_expiry: '2025-07-15',
    insurance_expiry: '2025-12-31',
    service_due_date: '2025-05-10',
  },
  {
    id: 'v3',
    registration: 'HG19 PQM',
    make: 'Volkswagen',
    model: 'Crafter',
    year: 2019,
    current_mileage: 112000,
    condition: 'Poor',
    purchase_price: 30000,
    mot_expiry: '2024-12-01',
    tax_expiry: '2025-08-01',
    insurance_expiry: '2026-03-15',
    service_due_date: '2025-04-28',
  },
]

export const SAMPLE_EXPENSES: ExpenseEntry[] = [
  { id: 'e1', vehicle_id: 'v1', date: '2025-04-10', category: 'Fuel', amount: 180, notes: 'Weekly fill' },
  { id: 'e2', vehicle_id: 'v1', date: '2025-04-05', category: 'Maintenance', amount: 320, notes: 'Oil change & filter' },
  { id: 'e3', vehicle_id: 'v2', date: '2025-04-12', category: 'Fuel', amount: 210, notes: '' },
  { id: 'e4', vehicle_id: 'v2', date: '2025-03-28', category: 'Repairs', amount: 850, notes: 'Brake pads & discs' },
  { id: 'e5', vehicle_id: 'v3', date: '2025-04-08', category: 'Insurance', amount: 1200, notes: 'Annual renewal' },
  { id: 'e6', vehicle_id: 'v3', date: '2025-04-11', category: 'Fuel', amount: 165, notes: '' },
]

export const SAMPLE_INCOME: IncomeEntry[] = [
  { id: 'i1', vehicle_id: 'v1', date: '2025-04-14', source: 'Delivery contract', amount: 2400, notes: '' },
  { id: 'i2', vehicle_id: 'v1', date: '2025-04-07', source: 'Courier work', amount: 1100, notes: '' },
  { id: 'i3', vehicle_id: 'v2', date: '2025-04-13', source: 'Removal job', amount: 1800, notes: '' },
  { id: 'i4', vehicle_id: 'v3', date: '2025-04-09', source: 'Courier work', amount: 950, notes: '' },
]

export const SAMPLE_MILEAGE: MileageEntry[] = [
  { id: 'm1', vehicle_id: 'v1', date: '2025-04-14', start_mileage: 34300, end_mileage: 34500, total_mileage: 200, notes: 'Delivery run' },
  { id: 'm2', vehicle_id: 'v2', date: '2025-04-13', start_mileage: 78050, end_mileage: 78200, total_mileage: 150, notes: 'Removal job' },
]
