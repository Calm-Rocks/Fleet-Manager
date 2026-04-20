import React from 'react'
import type { ReminderStatus } from '../types'
import { reminderStatus, reminderLabel } from '../utils'

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps { status: ReminderStatus }
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const map: Record<ReminderStatus, { cls: string; label: string }> = {
    overdue: { cls: 'badge-danger', label: 'Overdue' },
    soon:    { cls: 'badge-soon',   label: 'Due soon' },
    ok:      { cls: 'badge-ok',     label: 'OK' },
    unknown: { cls: 'badge-gray',   label: 'Not set' },
  }
  const { cls, label } = map[status]
  return <span className={`badge ${cls}`}>{label}</span>
}

// ─── Reminder Row ─────────────────────────────────────────────────────────────
interface ReminderRowProps { label: string; date: string | undefined }
export const ReminderRow: React.FC<ReminderRowProps> = ({ label, date }) => {
  const status = reminderStatus(date)
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#E5E3DD] last:border-b-0">
      <div>
        <p className="text-[13px] font-medium text-[#1A1916]">{label}</p>
        <p className="text-[12px] text-[#9B9890]">{reminderLabel(date)}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
    <div>
      <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-[#1A1916]">{title}</h1>
      {subtitle && <p className="text-[13px] text-[#6B6860] mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
)

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string
  sub?: string
  valueColor?: string
}
export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, valueColor }) => (
  <div className="fm-card">
    <p className="text-[11px] font-semibold text-[#6B6860] uppercase tracking-[0.4px] mb-1">{label}</p>
    <p className="text-[24px] font-semibold tracking-[-0.5px]" style={{ color: valueColor || '#1A1916' }}>
      {value}
    </p>
    {sub && <p className="text-[12px] text-[#9B9890] mt-0.5">{sub}</p>}
  </div>
)

// ─── Modal wrapper ────────────────────────────────────────────────────────────
interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}
export const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer }) => (
  <div
    className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 md:p-6 overflow-y-auto"
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    <div className="bg-white rounded-2xl border border-[#E5E3DD] w-full max-w-lg p-6 my-4">
      <h2 className="text-[17px] font-semibold mb-5 tracking-[-0.3px]">{title}</h2>
      {children}
      {footer && (
        <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-[#E5E3DD]">
          {footer}
        </div>
      )}
    </div>
  </div>
)

// ─── Form helpers ─────────────────────────────────────────────────────────────
interface FormGroupProps { label: string; children: React.ReactNode }
export const FormGroup: React.FC<FormGroupProps> = ({ label, children }) => (
  <div className="mb-3.5">
    <label className="fm-label">{label}</label>
    {children}
  </div>
)

interface FormRowProps { children: React.ReactNode }
export const FormRow: React.FC<FormRowProps> = ({ children }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
    {children}
  </div>
)

// ─── Empty state ──────────────────────────────────────────────────────────────
interface EmptyProps { icon: string; message: string }
export const Empty: React.FC<EmptyProps> = ({ icon, message }) => (
  <div className="text-center py-12 text-[#9B9890] text-[13px]">
    <div className="text-4xl mb-2">{icon}</div>
    <p>{message}</p>
  </div>
)

// ─── Stat row (for detail panels) ────────────────────────────────────────────
interface StatRowProps { label: string; value: string; valueClass?: string }
export const StatRow: React.FC<StatRowProps> = ({ label, value, valueClass }) => (
  <div className="flex justify-between items-center py-2 border-b border-[#E5E3DD] last:border-b-0 text-[13px]">
    <span className="text-[#6B6860]">{label}</span>
    <span className={`font-semibold ${valueClass || ''}`}>{value}</span>
  </div>
)

// ─── Category tag ─────────────────────────────────────────────────────────────
export const CategoryTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#F2F0EC] text-[#6B6860] text-[11px] font-medium">
    {label}
  </span>
)

// ─── Bar chart (simple CSS) ───────────────────────────────────────────────────
interface BarChartProps {
  items: Array<{ label: string; value: number; formatted: string }>
  max: number
}
export const SimpleBarChart: React.FC<BarChartProps> = ({ items, max }) => (
  <div>
    {items.map(item => (
      <div key={item.label} className="mb-2.5">
        <div className="flex justify-between text-[12px] mb-1">
          <span className="text-[#6B6860]">{item.label}</span>
          <span className="font-semibold">{item.formatted}</span>
        </div>
        <div className="bg-[#F2F0EC] rounded h-2 overflow-hidden">
          <div
            className="h-full rounded bg-[#2563EB] transition-all duration-500"
            style={{ width: `${Math.round((item.value / max) * 100)}%` }}
          />
        </div>
      </div>
    ))}
  </div>
)

// ─── Vehicle registration pill ────────────────────────────────────────────────
export const RegPill: React.FC<{ reg: string }> = ({ reg }) => (
  <span className="font-mono text-[12px] font-bold text-[#1A3A5C] tracking-wide">{reg}</span>
)

// ─── Divider ─────────────────────────────────────────────────────────────────
export const Divider: React.FC = () => <hr className="border-[#E5E3DD] my-4" />

// ─── Loading spinner ─────────────────────────────────────────────────────────
export const Spinner: React.FC = () => (
  <div className="flex items-center justify-center h-48">
    <div className="w-6 h-6 border-2 border-[#E5E3DD] border-t-[#2563EB] rounded-full animate-spin" />
  </div>
)
