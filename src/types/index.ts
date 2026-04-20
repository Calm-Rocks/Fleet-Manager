export type VehicleCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor'

export interface Vehicle {
  id: string
  user_id?: string
  company_id?: string
  registration: string
  make: string
  model: string
  year: number | string
  current_mileage: number | string
  condition: VehicleCondition
  purchase_price: number | string
  estimated_market_value?: number
  mot_expiry: string
  tax_expiry: string
  insurance_expiry: string
  service_due_date: string
  created_at?: string
}

export interface MileageEntry {
  id: string
  user_id?: string
  company_id?: string
  vehicle_id: string
  date: string
  start_mileage: number | string
  end_mileage: number | string
  total_mileage: number | string
  notes?: string
  created_at?: string
}

export type ExpenseCategory = 'Fuel' | 'Maintenance' | 'Insurance' | 'Tax' | 'Repairs' | 'Other'

export interface ExpenseEntry {
  id: string
  user_id?: string
  company_id?: string
  vehicle_id: string
  date: string
  category: ExpenseCategory
  amount: number | string
  notes?: string
  created_at?: string
}

export interface IncomeEntry {
  id: string
  user_id?: string
  company_id?: string
  vehicle_id: string
  date: string
  source: string
  amount: number | string
  notes?: string
  created_at?: string
}

export type ReminderStatus = 'overdue' | 'soon' | 'ok' | 'unknown'

export interface ReminderItem {
  vehicle: Vehicle
  type: string
  date: string
  status: ReminderStatus
  days: number | null
}

export interface DepreciationResult {
  currentValue: number
  depreciation: number
  pct: number
}

// ── Auth & Company ─────────────────────────────────────────────────────────────

export type CompanyRole = 'owner' | 'manager' | 'driver'

export interface Company {
  id: string
  name: string
  slug?: string
  address_line1?: string
  address_line2?: string
  city?: string
  postcode?: string
  phone?: string
  email?: string
  vat_number?: string
  companies_house_number?: string
  created_at?: string
}

export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: CompanyRole
  created_at?: string
}

export interface Profile {
  id: string
  full_name?: string
  email?: string
  company_id?: string
  created_at?: string
}

export interface AuthUser {
  id: string
  email?: string
}

// ── DVLA ───────────────────────────────────────────────────────────────────────

export interface DvlaVehicleData {
  registration: string
  make: string
  colour: string
  fuelType: string
  yearOfManufacture: number
  engineCapacity?: number
  co2Emissions?: number
  motExpiryDate?: string
  taxDueDate?: string
  motStatus?: string
  taxStatus?: string
}

export interface DvlaLookupResult {
  success: boolean
  data?: DvlaVehicleData
  error?: string
}

// ── Integration status ─────────────────────────────────────────────────────────

export type IntegrationStatus = 'connected' | 'disconnected' | 'coming_soon'

export interface Integration {
  id: string
  name: string
  description: string
  icon: string
  status: IntegrationStatus
  connectUrl?: string
  category: 'accounting' | 'jobs' | 'telematics' | 'government' | 'automation'
}
