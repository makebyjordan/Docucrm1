import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import KanbanCard from './KanbanCard'
import { AlertCircle } from 'lucide-react'

const COLUMNS = [
  { id: 'CAPTACION', label: 'Captación', color: 'bg-[var(--sidebar-bg)] border-t-2 border-gray-500' },
  { id: 'FORMULARIO', label: 'Formulario', color: 'bg-[var(--sidebar-bg)] border-t-2 border-blue-500' },
  { id: 'DOCUMENTACION', label: 'Documentación', color: 'bg-[var(--sidebar-bg)] border-t-2 border-indigo-500' },
  { id: 'VALIDACION', label: 'Validación', color: 'bg-[var(--sidebar-bg)] border-t-2 border-purple-500' },
  { id: 'ACUERDO', label: 'Acuerdo', color: 'bg-[var(--sidebar-bg)] border-t-2 border-yellow-500' },
  { id: 'MARKETING_FORMULARIO', label: 'Brief Mkt', color: 'bg-[var(--sidebar-bg)] border-t-2 border-orange-500' },
  { id: 'MARKETING_EJECUCION', label: 'Producción', color: 'bg-[var(--sidebar-bg)] border-t-2 border-amber-500' },
  { id: 'PREVENTA', label: 'Preventa', color: 'bg-[var(--sidebar-bg)] border-t-2 border-green-500' },
  { id: 'BUSQUEDA_ACTIVA', label: 'Búsqueda', color: 'bg-[var(--sidebar-bg)] border-t-2 border-teal-500' },
  { id: 'ACUERDO_INTERESADO', label: 'Interesado', color: 'bg-[var(--sidebar-bg)] border-t-2 border-cyan-500' },
  { id: 'CIERRE', label: 'Cierre', color: 'bg-[var(--sidebar-bg)] border-t-2 border-emerald-500' },
  { id: 'POSVENTA', label: 'Posventa', color: 'bg-[var(--sidebar-bg)] border-t-2 border-lime-500' },
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
          <div key={col.id} className="flex-shrink-0 w-64">
            {/* Column header */}
            <div className={`rounded-t-lg px-3 py-2 ${col.color} flex items-center justify-between`}>
              <span className="font-semibold text-sm text-[var(--text-main)]">{col.label}</span>
              <span className="text-xs bg-black/30 rounded-full px-2 py-0.5 font-mono font-bold text-[var(--text-main)]">
                {cards.length}
              </span>
            </div>
            {/* Cards */}
            <div className="bg-[var(--sidebar-bg)] rounded-b-lg min-h-24 p-2 space-y-2">
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
