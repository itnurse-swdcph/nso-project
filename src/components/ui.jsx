import { X } from 'lucide-react';
import { statusTone } from '../utils/status';

const toneClasses = {
  red: 'bg-red-50 text-red-700 ring-red-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-hospital-blue ring-blue-100'
};

export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="font-prompt text-sm font-semibold text-hospital-teal">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold text-hospital-navy md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, helper, icon: Icon, tone = 'blue' }) {
  const iconTone = tone === 'teal' ? 'bg-teal-50 text-hospital-teal' : tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-hospital-blue';
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-prompt text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 font-prompt text-3xl font-bold text-hospital-navy">{value}</p>
        </div>
        {Icon ? (
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${iconTone}`}>
            <Icon size={22} />
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-3 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export function StatusBadge({ status, tone }) {
  const resolvedTone = tone || statusTone[status] || 'slate';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneClasses[resolvedTone]}`}>
      {status}
    </span>
  );
}

export function ProgressBar({ value, showLabel = true }) {
  const width = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="flex min-w-32 items-center gap-2">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-hospital-teal to-hospital-blue" style={{ width: `${width}%` }} />
      </div>
      {showLabel ? <span className="w-10 text-right text-xs font-semibold text-slate-500">{width}%</span> : null}
    </div>
  );
}

export function Modal({ title, children, footer, open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-hospital-line bg-hospital-mist px-5 py-4">
          <h2 className="font-prompt text-lg font-bold text-hospital-navy">{title}</h2>
          <button className="rounded-xl p-2 text-slate-500 hover:bg-white" type="button" onClick={onClose} aria-label="ปิด">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[66vh] overflow-auto p-5">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-hospital-line px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ title = 'ไม่มีข้อมูล', description = 'ยังไม่มีรายการในส่วนนี้' }) {
  return (
    <div className="rounded-2xl border border-dashed border-hospital-line bg-slate-50 px-4 py-10 text-center">
      <p className="font-prompt font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function ConfirmDelete({ onConfirm, children = 'ลบ' }) {
  return (
    <button
      className="btn-danger"
      type="button"
      onClick={() => {
        if (window.confirm('ยืนยันการลบข้อมูลนี้?')) onConfirm();
      }}
    >
      {children}
    </button>
  );
}
