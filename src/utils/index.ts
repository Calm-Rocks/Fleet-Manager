import type { ReminderStatus, DepreciationResult, VehicleCondition } from '../types'

// ─── Currency formatting ──────────────────────────────────────────────────────
export const fmt = (n: number | string | undefined): string => {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0)
  if (isNaN(num)) return '£0'
  return '£' + num.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export const fmtNum = (n: number | string | undefined): string => {
  const num = typeof n === 'string' ? parseInt(n) : (n ?? 0)
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-GB')
}

// ─── Date / reminder helpers ──────────────────────────────────────────────────
export const daysUntil = (dateStr: string | undefined): number | null => {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const reminderStatus = (dateStr: string | undefined): ReminderStatus => {
  const days = daysUntil(dateStr)
  if (days === null) return 'unknown'
  if (days < 0) return 'overdue'
  if (days <= 30) return 'soon'
  return 'ok'
}

export const reminderLabel = (dateStr: string | undefined): string => {
  const days = daysUntil(dateStr)
  if (days === null) return 'Not set'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days <= 30) return `${days}d away`
  return new Date(dateStr!).toLocaleDateString('en-GB')
}

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Depreciation calculator ──────────────────────────────────────────────────
// Formula:
//   1. Start with purchase price
//   2. Apply a mileage-based retention factor (how much value is left at this mileage)
//   3. Apply a condition multiplier
//
// Mileage bands (approximate UK used-van market retention):
//   <15k  → 92%   |   15–30k  → 86%   |   30–50k  → 80%
//   50–75k → 72%  |  75–100k  → 63%   |  100–150k → 54%
//   150–200k → 44% |  >200k   → 30%
//
// Condition multipliers:
//   Excellent → +5%  |  Good → 0%  |  Fair → -12%  |  Poor → -28%

export const calcDepreciation = (
  purchasePrice: number | string | undefined,
  mileage: number,
  condition: VehicleCondition | string
): DepreciationResult => {
  const price = parseFloat(String(purchasePrice)) || 0
  if (!price) return { currentValue: 0, depreciation: 0, pct: 0 }

  let retentionFactor: number
  if (mileage > 200000) retentionFactor = 0.30
  else if (mileage > 150000) retentionFactor = 0.44
  else if (mileage > 100000) retentionFactor = 0.54
  else if (mileage > 75000) retentionFactor = 0.63
  else if (mileage > 50000) retentionFactor = 0.72
  else if (mileage > 30000) retentionFactor = 0.80
  else if (mileage > 15000) retentionFactor = 0.86
  else retentionFactor = 0.92

  const conditionMultipliers: Record<string, number> = {
    Excellent: 1.05,
    Good: 1.00,
    Fair: 0.88,
    Poor: 0.72,
  }
  const condMult = conditionMultipliers[condition] ?? 1.0

  const currentValue = Math.max(0, Math.round(price * retentionFactor * condMult))
  const depreciation = price - currentValue
  const pct = price > 0 ? Math.round((depreciation / price) * 100) : 0

  return { currentValue, depreciation, pct }
}

// ─── Financial summary helpers ────────────────────────────────────────────────
export const getCurrentMonth = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const sumByMonth = (
  entries: Array<{ date: string; amount: number | string }>,
  month?: string
): number => {
  const target = month ?? getCurrentMonth()
  return entries
    .filter(e => e.date?.slice(0, 7) === target)
    .reduce((s, e) => s + (parseFloat(String(e.amount)) || 0), 0)
}

export const sumAll = (entries: Array<{ amount: number | string }>): number =>
  entries.reduce((s, e) => s + (parseFloat(String(e.amount)) || 0), 0)

export const groupByCategory = (
  entries: Array<{ category: string; amount: number | string }>
): Record<string, number> =>
  entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (parseFloat(String(e.amount)) || 0)
    return acc
  }, {})

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const uid = (): string => Math.random().toString(36).slice(2, 10)

export const todayIso = (): string => new Date().toISOString().slice(0, 10)

export const EXPENSE_CATEGORIES = ['Fuel', 'Maintenance', 'Insurance', 'Tax', 'Repairs', 'Other'] as const
export const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'] as const
