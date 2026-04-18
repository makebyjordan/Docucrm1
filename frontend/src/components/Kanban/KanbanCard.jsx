import { MapPin, User, AlertTriangle } from 'lucide-react'

const TYPE_COLORS = {
  VENTA: 'bg-blue-100 text-blue-700',
  INQUILINO: 'bg-green-100 text-green-700',
  COMPRA: 'bg-yellow-100 text-yellow-700',
  PROPIETARIO: 'bg-orange-100 text-orange-700',
  INVERSION_HOLDERS: 'bg-purple-100 text-purple-700',
}

export default function KanbanCard({ expedient }) {
  const clientName = expedient.client?.firstName
    ? `${expedient.client.firstName} ${expedient.client.lastName || ''}`.trim()
    : expedient.client?.companyName || 'Sin cliente'

  const comercial = expedient.assignments?.find(a => a.role === 'COMERCIAL')

  return (
    <div className={`card p-3 text-sm cursor-pointer hover:shadow-md transition-shadow ${
      expedient.status === 'BLOQUEADO' ? 'border-l-4 border-l-red-500' : ''
    }`}>
      {/* Code + status */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs font-bold text-gray-600">{expedient.code}</span>
        <span className={`badge text-xs ${TYPE_COLORS[expedient.operationType] || 'bg-gray-100 text-gray-700'}`}>
          {expedient.operationType}
        </span>
      </div>

      {/* Client */}
      <div className="flex items-center gap-1.5 text-gray-700 mb-1">
        <User size={12} className="text-gray-400 shrink-0" />
        <span className="truncate font-medium text-xs">{clientName}</span>
      </div>

      {/* Address */}
      {expedient.propertyAddress && (
        <div className="flex items-center gap-1.5 text-gray-500 mb-2">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate text-xs">{expedient.propertyAddress}</span>
        </div>
      )}

      {/* Price */}
      {expedient.propertyPrice && (
        <p className="text-xs font-bold text-blue-600 mb-2">
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
          <div className="ml-auto w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
            title={comercial.user?.name}>
            {comercial.user?.name?.charAt(0)}
          </div>
        )}
      </div>
    </div>
  )
}
