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
  ACTIVO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  BLOQUEADO: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  COMPLETADO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  CANCELADO: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400',
}

export default function ExpedientsList({ filters }) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  const { data, isLoading } = useQuery({
    queryKey: ['expedients-list', filters],
    queryFn: () => api.get('/expedients', { params }).then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)] mr-3"></div>
      Cargando expedientes...
    </div>
  )

  const items = data?.data || []

  return (
    <div className="card shadow-sm border-[var(--border-color)] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="table-header">
          <tr>
            {['Referencia', 'Cliente', 'Operación', 'Inmueble', 'Fase', 'Estado', 'Apertura', ''].map(h => (
              <th key={h} className="text-left px-5 py-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {items.length === 0 && (
            <tr><td colSpan={8} className="text-center text-gray-400 py-16">Sin expedientes en esta vista</td></tr>
          )}
          {items.map(exp => {
            const clientName = exp.client?.firstName
              ? `${exp.client.firstName} ${exp.client.lastName || ''}`.trim()
              : exp.client?.companyName || '—'

            return (
              <tr key={exp.id} className="table-row group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {exp.status === 'BLOQUEADO' && <AlertTriangle size={14} className="text-red-500" />}
                    <span className="font-mono font-bold text-[var(--primary-color)] text-xs">{exp.code}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="font-bold text-[var(--text-main)]">{clientName}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="badge bg-[var(--primary-glow)] text-[var(--primary-color)]">
                    {exp.operationType}
                  </span>
                </td>
                <td className="px-5 py-4 text-[var(--text-muted)] max-w-48 truncate">{exp.propertyAddress || '—'}</td>
                <td className="px-5 py-4">
                   <span className="text-[var(--text-main)] font-medium">
                    {PHASE_LABELS[exp.currentPhase] || exp.currentPhase}
                   </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`badge ${STATUS_BADGE[exp.status] || 'bg-[var(--bg-color)] text-[var(--text-muted)] border border-[var(--border-color)]'}`}>
                    {exp.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-[var(--text-muted)] text-[11px] font-medium">
                  {format(new Date(exp.openedAt), 'dd MMM yyyy', { locale: es })}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link to={`/expedients/${exp.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--primary-glow)] text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-all">
                    <ChevronRight size={18} />
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
