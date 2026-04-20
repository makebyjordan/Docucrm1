import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import KanbanCard from './KanbanCard'
import { AlertCircle } from 'lucide-react'

const COLUMNS = [
  { id: 'CAPTACION', label: 'Captación', color: 'border-slate-400' },
  { id: 'FORMULARIO', label: 'Formulario', color: 'border-blue-500' },
  { id: 'DOCUMENTACION', label: 'Documentación', color: 'border-indigo-500' },
  { id: 'VALIDACION', label: 'Validación', color: 'border-purple-500' },
  { id: 'ACUERDO', label: 'Acuerdo', color: 'border-yellow-500' },
  { id: 'MARKETING_FORMULARIO', label: 'Brief Mkt', color: 'border-orange-500' },
  { id: 'MARKETING_EJECUCION', label: 'Producción', color: 'border-rose-500' },
  { id: 'PREVENTA', label: 'Preventa', color: 'border-emerald-500' },
  { id: 'BUSQUEDA_ACTIVA', label: 'Búsqueda', color: 'border-teal-500' },
  { id: 'ACUERDO_INTERESADO', label: 'Interesado', color: 'border-cyan-500' },
  { id: 'CIERRE', label: 'Cierre', color: 'border-green-500' },
  { id: 'POSVENTA', label: 'Posventa', color: 'border-violet-500' },
]

export default function KanbanBoard({ filters }) {
  const { data: columns, isLoading, error } = useQuery({
    queryKey: ['kanban', filters],
    queryFn: () => api.get('/expedients/kanban').then(r => r.data),
    refetchInterval: 30_000,
  })

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando tablero...</div>
  if (error) return (
    <div className="flex items-center justify-center h-64 gap-2 text-red-500">
      <AlertCircle size={18} /> Error al cargar el tablero
    </div>
  )

  // Aplicar filtros locales
  const filter = (items = []) => {
    return items.filter(exp => {
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        const match = exp.code.toLowerCase().includes(q)
          || exp.propertyAddress?.toLowerCase().includes(q)
          || exp.client?.firstName?.toLowerCase().includes(q)
          || exp.client?.lastName?.toLowerCase().includes(q)
          || exp.client?.companyName?.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filters?.operationType && exp.operationType !== filters.operationType) return false
      if (filters?.status && exp.status !== filters.status) return false
      return true
    })
  }

  return (
    <div className="flex gap-3 overflow-x-auto h-full pb-4">
      {COLUMNS.map(col => {
        const cards = filter(columns?.[col.id] || [])
        return (
          <div key={col.id} className="flex-shrink-0 w-72 flex flex-col h-full bg-[var(--sidebar-bg)]/50 rounded-xl border border-[var(--border-color)] overflow-hidden">
            {/* Column header */}
            <div className={`px-4 py-3 bg-[var(--sidebar-bg)] border-t-4 ${col.color} flex items-center justify-between shadow-sm`}>
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-main)]">{col.label}</span>
              <span className="text-[10px] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full px-2 py-0.5 font-bold text-[var(--text-muted)]">
                {cards.length}
              </span>
            </div>
            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
              {cards.map(exp => (
                <Link key={exp.id} to={`/expedients/${exp.id}`}>
                  <KanbanCard expedient={exp} />
                </Link>
              ))}
              {cards.length === 0 && (
                <p className="text-center text-gray-400 text-xs py-4">Sin expedientes</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
