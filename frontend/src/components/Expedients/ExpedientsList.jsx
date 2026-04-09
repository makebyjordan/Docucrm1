import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const PHASE_LABELS = {
  CAPTACION: 'Captación', FORMULARIO: 'Formulario', DOCUMENTACION: 'Documentación',
  VALIDACION: 'Validación', ACUERDO: 'Acuerdo', MARKETING_FORMULARIO: 'Brief Mkt',
  MARKETING_EJECUCION: 'Producción Mkt', PREVENTA: 'Preventa', BUSQUEDA_ACTIVA: 'Búsqueda activa',
  ACUERDO_INTERESADO: 'Ac. Interesado', CIERRE: 'Cierre', POSVENTA: 'Posventa',
  CERRADO: 'Cerrado', CANCELADO: 'Cancelado',
}

const STATUS_BADGE = {
  ACTIVO: 'bg-green-100 text-green-700',
  BLOQUEADO: 'bg-red-100 text-red-700',
  COMPLETADO: 'bg-blue-100 text-blue-700',
  CANCELADO: 'bg-gray-100 text-gray-500',
}

export default function ExpedientsList({ filters }) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  const { data, isLoading } = useQuery({
    queryKey: ['expedients-list', filters],
    queryFn: () => api.get('/expedients', { params }).then(r => r.data),
  })

  if (isLoading) return <div className="text-center text-gray-400 py-10">Cargando...</div>

  const items = data?.data || []

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Referencia', 'Cliente', 'Operación', 'Inmueble', 'Fase', 'Estado', 'Apertura', ''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.length === 0 && (
            <tr><td colSpan={8} className="text-center text-gray-400 py-10">Sin expedientes</td></tr>
          )}
          {items.map(exp => {
            const clientName = exp.client?.firstName
              ? `${exp.client.firstName} ${exp.client.lastName || ''}`.trim()
              : exp.client?.companyName || '—'

            return (
              <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {exp.status === 'BLOQUEADO' && <AlertTriangle size={14} className="text-red-500" />}
                    <span className="font-mono font-bold text-gray-800 text-xs">{exp.code}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{clientName}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-blue-50 text-blue-700">{exp.operationType}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-40 truncate">{exp.propertyAddress || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{PHASE_LABELS[exp.currentPhase] || exp.currentPhase}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[exp.status] || ''}`}>{exp.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {format(new Date(exp.openedAt), 'dd/MM/yyyy', { locale: es })}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/expedients/${exp.id}`} className="text-blue-600 hover:text-blue-800">
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
