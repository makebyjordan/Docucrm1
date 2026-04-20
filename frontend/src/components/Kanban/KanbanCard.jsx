import { MapPin, User, AlertTriangle } from 'lucide-react'

const TYPE_COLORS = {
  VENTA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50',
  INQUILINO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
  COMPRA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50',
  PROPIETARIO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50',
  INVERSION_HOLDERS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50',
}

export default function KanbanCard({ expedient }) {
  const clientName = expedient.client?.firstName
    ? `${expedient.client.firstName} ${expedient.client.lastName || ''}`.trim()
    : expedient.client?.companyName || 'Sin cliente'

  const comercial = expedient.assignments?.find(a => a.role === 'COMERCIAL')

  return (
    <div className={`card p-4 text-sm cursor-pointer hover:shadow-xl hover:translate-y-[-2px] hover:border-[var(--primary-color)] transition-all ${
      expedient.status === 'BLOQUEADO' ? 'border-l-4 border-l-red-500' : ''
    }`}>
      {/* Code + status */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] font-bold text-[var(--text-muted)] tracking-wider">{expedient.code}</span>
        <span className={`badge text-[9px] uppercase font-bold px-2 py-0.5 ${TYPE_COLORS[expedient.operationType] || 'bg-[var(--bg-color)] text-[var(--text-muted)]'}`}>
          {expedient.operationType}
        </span>
      </div>

      {/* Client */}
      <div className="flex items-center gap-2 text-[var(--text-main)] mb-1.5">
        <div className="w-5 h-5 rounded-md bg-[var(--primary-glow)] flex items-center justify-center shrink-0">
          <User size={12} className="text-[var(--primary-color)]" />
        </div>
        <span className="truncate font-bold text-xs">{clientName}</span>
      </div>

      {/* Address */}
      {expedient.propertyAddress && (
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-3">
          <MapPin size={12} className="shrink-0 opacity-70" />
          <span className="truncate text-[10px] italic">{expedient.propertyAddress}</span>
        </div>
      )}

      {/* Price */}
      {expedient.propertyPrice && (
        <p className="text-sm font-extrabold text-[var(--primary-color)] mb-3">
          {Number(expedient.propertyPrice).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
        </p>
      )}

      {/* Bottom */}
      <div className="flex items-center justify-between mt-1 pt-3 border-t border-[var(--border-color)]">
        {expedient.status === 'BLOQUEADO' && (
          <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider">
            <AlertTriangle size={12} /> BLOQUEADO
          </span>
        )}
        {comercial && (
          <div className="ml-auto w-6 h-6 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
            title={comercial.user?.name}>
            {comercial.user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}
