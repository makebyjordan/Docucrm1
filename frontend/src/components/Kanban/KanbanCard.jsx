import { MapPin, User, AlertTriangle } from 'lucide-react'

const TYPE_COLORS = {
  VENTA: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  INQUILINO: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  COMPRA: 'bg-amber-900/40 text-amber-400 border border-amber-800/50',
  PROPIETARIO: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  INVERSION_HOLDERS: 'bg-purple-900/40 text-purple-400 border border-purple-800/50',
}

export default function KanbanCard({ expedient }) {
  const clientName = expedient.client?.firstName
    ? `${expedient.client.firstName} ${expedient.client.lastName || ''}`.trim()
    : expedient.client?.companyName || 'Sin cliente'

  const comercial = expedient.assignments?.find(a => a.role === 'COMERCIAL')

  return (
    <div className={`card p-3 text-sm cursor-pointer hover:shadow-lg hover:border-[var(--secondary-color)] transition-all ${
      expedient.status === 'BLOQUEADO' ? 'border-l-4 border-l-red-500' : ''
    }`}>
      {/* Code + status */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] font-bold text-[var(--text-muted)]">{expedient.code}</span>
        <span className={`badge text-[9px] ${TYPE_COLORS[expedient.operationType] || 'bg-[var(--bg-color)] text-[var(--text-muted)]'}`}>
          {expedient.operationType}
        </span>
      </div>

      {/* Client */}
      <div className="flex items-center gap-1.5 text-[var(--text-main)] mb-1">
        <User size={12} className="text-[var(--secondary-color)] shrink-0" />
        <span className="truncate font-bold text-xs">{clientName}</span>
      </div>

      {/* Address */}
      {expedient.propertyAddress && (
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-2">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate text-[10px]">{expedient.propertyAddress}</span>
        </div>
      )}

      {/* Price */}
      {expedient.propertyPrice && (
        <p className="text-xs font-bold text-[var(--secondary-color)] mb-2">
          {Number(expedient.propertyPrice).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
        </p>
      )}

      {/* Bottom */}
      <div className="flex items-center justify-between mt-1">
        {expedient.status === 'BLOQUEADO' && (
          <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
            <AlertTriangle size={11} /> Bloqueado
          </span>
        )}
        {comercial && (
          <div className="ml-auto w-6 h-6 rounded-full bg-[var(--sidebar-bg)]0 flex items-center justify-center text-white text-xs font-bold"
            title={comercial.user?.name}>
            {comercial.user?.name?.charAt(0)}
          </div>
        )}
      </div>
    </div>
  )
}
