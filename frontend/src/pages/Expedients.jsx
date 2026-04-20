import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Search, Filter } from 'lucide-react'
import api from '../api/client'
import KanbanBoard from '../components/Kanban/KanbanBoard'
import ExpedientsList from '../components/Expedients/ExpedientsList'

export default function ExpedientsPage() {
  const [view, setView] = useState('kanban') // 'kanban' | 'list'
  const [filters, setFilters] = useState({ search: '', operationType: '', status: '' })

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar expediente, cliente, dirección..."
            className="input pl-9"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        {/* Filtro tipo */}
        <select
          className="select w-40"
          value={filters.operationType}
          onChange={e => setFilters(f => ({ ...f, operationType: e.target.value }))}
        >
          <option value="">Todos los tipos</option>
          {[
            { value: 'INQUILINO', label: 'Inquilino' },
            { value: 'PROPIETARIO', label: 'Propietario' },
            { value: 'COMPRA', label: 'Compra' },
            { value: 'VENTA', label: 'Venta' },
            { value: 'INVERSION_HOLDERS', label: 'Inversión Holders' }
          ].map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Filtro estado */}
        <select
          className="select w-36"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">Todos</option>
          <option value="ACTIVO">Activos</option>
          <option value="BLOQUEADO">Bloqueados</option>
          <option value="COMPLETADO">Completados</option>
        </select>

        {/* Vista */}
        <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--bg-color)]'}`}
          >
            <LayoutGrid size={15} /> Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 border-l border-[var(--border-color)] ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--bg-color)]'}`}
          >
            <List size={15} /> Lista
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-h-0">
        {view === 'kanban'
          ? <KanbanBoard filters={filters} />
          : <ExpedientsList filters={filters} />
        }
      </div>
    </div>
  )
}
