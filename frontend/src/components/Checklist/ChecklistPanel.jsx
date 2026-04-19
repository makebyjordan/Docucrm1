import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { CheckCircle, Circle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function ChecklistPanel({ expedientId }) {
  const qc = useQueryClient()

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['checklists', expedientId],
    queryFn: () => api.get(`/checklists/expedient/${expedientId}`).then(r => r.data),
  })

  const toggleItem = useMutation({
    mutationFn: ({ instanceId, itemId, completed, notes }) =>
      api.put(`/checklists/instance/${instanceId}/item/${itemId}`, { completed, notes }),
    onSuccess: () => qc.invalidateQueries(['checklists', expedientId]),
    onError: () => toast.error('Error al actualizar el ítem'),
  })

  const generateMutation = useMutation({
    mutationFn: () => api.post(`/checklists/expedient/${expedientId}/generate`),
    onSuccess: () => { toast.success('Checklist generada'); qc.invalidateQueries(['checklists', expedientId]) },
  })

  if (isLoading) return <div className="text-gray-400 text-center py-10">Cargando checklists...</div>

  if (!checklists?.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500 mb-4">No hay checklists para esta fase.</p>
        <button onClick={() => generateMutation.mutate()} className="btn-primary">
          <RefreshCw size={15} /> Generar checklist
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {checklists.map(instance => (
        <ChecklistInstance
          key={instance.id}
          instance={instance}
          onToggle={(itemId, completed) =>
            toggleItem.mutate({ instanceId: instance.id, itemId, completed })
          }
        />
      ))}
    </div>
  )
}

function ChecklistInstance({ instance, onToggle }) {
  const [expanded, setExpanded] = useState(true)
  const { progress } = instance

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[var(--bg-color)]"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <span className="font-semibold text-[var(--text-main)]">{instance.template?.name}</span>
          {instance.completedAt && (
            <span className="badge bg-green-100 text-green-700 text-xs">Completada</span>
          )}
        </div>
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">{progress.done}/{progress.total}</div>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress.percent === 100 ? 'bg-[var(--sidebar-bg)]0' :
                progress.percent > 50 ? 'bg-[var(--sidebar-bg)]0' : 'bg-yellow-400'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[var(--text-muted)]">{progress.percent}%</span>
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {instance.items.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-[var(--bg-color)] transition-colors ${
                item.completed ? 'bg-[var(--sidebar-bg)]/40' : ''
              }`}
              onClick={() => onToggle(item.id, !item.completed)}
            >
              <div className="mt-0.5 shrink-0">
                {item.completed
                  ? <CheckCircle size={18} className="text-green-500" />
                  : <Circle size={18} className="text-gray-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.completed ? 'line-through text-gray-400' : 'text-[var(--text-main)]'}`}>
                  {item.label}
                  {item.required && !item.completed && (
                    <span className="ml-2 text-red-400 text-xs">*obligatorio</span>
                  )}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                )}
                {item.completedAt && (
                  <p className="text-xs text-green-600 mt-0.5">
                    ✓ {item.completedBy} · {new Date(item.completedAt).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
