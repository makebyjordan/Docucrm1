import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, AlertTriangle,
  FolderOpen, FileText, Bell, Users, History, RefreshCw,
} from 'lucide-react'
import api from '../api/client'
import ChecklistPanel from '../components/Checklist/ChecklistPanel'
import DocumentPanel from '../components/Documents/DocumentPanel'
import WorkflowStepper from '../components/Workflow/WorkflowStepper'
import NotificationLog from '../components/Notifications/NotificationLog'

const TABS = [
  { id: 'overview', label: 'Resumen', icon: FolderOpen },
  { id: 'checklist', label: 'Checklist', icon: CheckCircle },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'history', label: 'Historial', icon: History },
]

const PHASE_LABELS = {
  CAPTACION: 'Captación', FORMULARIO: 'Formulario', DOCUMENTACION: 'Documentación',
  VALIDACION: 'Validación', ACUERDO: 'Acuerdo', MARKETING_FORMULARIO: 'Brief Marketing',
  MARKETING_EJECUCION: 'Producción Marketing', PREVENTA: 'Preventa', BUSQUEDA_ACTIVA: 'Búsqueda activa',
  ACUERDO_INTERESADO: 'Acuerdo interesado', CIERRE: 'Cierre', POSVENTA: 'Posventa',
  CERRADO: 'Cerrado', CANCELADO: 'Cancelado',
}

const CONDITIONAL_PHASES = ['VALIDACION', 'BUSQUEDA_ACTIVA', 'CIERRE']

export default function ExpedientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')
  const [advanceModal, setAdvanceModal] = useState(false)
  const [decision, setDecision] = useState('SI')
  const [notes, setNotes] = useState('')

  const { data: exp, isLoading } = useQuery({
    queryKey: ['expedient', id],
    queryFn: () => api.get(`/expedients/${id}`).then(r => r.data),
  })

  const advanceMutation = useMutation({
    mutationFn: (payload) => api.post(`/expedients/${id}/advance`, payload),
    onSuccess: (res) => {
      toast.success(`Avanzado a: ${PHASE_LABELS[res.data.toPhase] || res.data.toPhase}`)
      qc.invalidateQueries(['expedient', id])
      qc.invalidateQueries(['kanban'])
      setAdvanceModal(false)
      setNotes('')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al avanzar'),
  })

  const blockMutation = useMutation({
    mutationFn: (reason) => api.post(`/expedients/${id}/block`, { reason }),
    onSuccess: () => { toast.success('Expediente bloqueado'); qc.invalidateQueries(['expedient', id]) },
  })

  const unblockMutation = useMutation({
    mutationFn: () => api.post(`/expedients/${id}/unblock`),
    onSuccess: () => { toast.success('Expediente desbloqueado'); qc.invalidateQueries(['expedient', id]) },
  })

  const closeMutation = useMutation({
    mutationFn: () => api.post(`/expedients/${id}/close`),
    onSuccess: () => { toast.success('Operación cerrada'); qc.invalidateQueries(['expedient', id]) },
  })

  const renewMutation = useMutation({
    mutationFn: (months) => api.post(`/expedients/${id}/renew-exclusivity`, { months }),
    onSuccess: () => { toast.success('Exclusividad renovada'); qc.invalidateQueries(['expedient', id]) },
  })

  if (isLoading) return <div className="text-center text-gray-400 py-20">Cargando expediente...</div>
  if (!exp) return <div className="text-center text-red-500 py-20">Expediente no encontrado</div>

  const clientName = exp.client?.firstName
    ? `${exp.client.firstName} ${exp.client.lastName || ''}`.trim()
    : exp.client?.companyName || 'Sin cliente'

  const isConditional = CONDITIONAL_PHASES.includes(exp.currentPhase)
  const isFinal = ['CERRADO', 'CANCELADO', 'POSVENTA'].includes(exp.currentPhase)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/expedients')} className="btn-secondary px-2">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 font-mono">{exp.code}</h2>
            <span className={`badge text-xs ${
              exp.status === 'BLOQUEADO' ? 'bg-red-100 text-red-700' :
              exp.status === 'COMPLETADO' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>{exp.status}</span>
            <span className="badge bg-gray-100 text-gray-700 text-xs">{exp.operationType}</span>
            {exp.operationSize !== 'INDIVIDUAL' && (
              <span className="badge bg-purple-100 text-purple-700 text-xs">{exp.operationSize}</span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {clientName} · {exp.propertyAddress || 'Sin dirección'}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {exp.status === 'BLOQUEADO' ? (
            <button onClick={() => unblockMutation.mutate()} className="btn-primary">
              <CheckCircle size={15} /> Desbloquear
            </button>
          ) : exp.status === 'ACTIVO' && !isFinal && (
            <button onClick={() => setAdvanceModal(true)} className="btn-primary">
              <ArrowRight size={15} /> Avanzar fase
            </button>
          )}
          {exp.status === 'ACTIVO' && exp.currentPhase === 'CIERRE' && (
            <button onClick={() => closeMutation.mutate()} className="btn-primary bg-green-600 hover:bg-green-700">
              <CheckCircle size={15} /> Cerrar operación
            </button>
          )}
          {exp.driveFolder && (
            <a href={`https://drive.google.com/drive/folders/${exp.driveFolderId}`} target="_blank" rel="noreferrer"
              className="btn-secondary">
              <FolderOpen size={15} /> Drive
            </a>
          )}
        </div>
      </div>

      {/* Stepper */}
      <WorkflowStepper currentPhase={exp.currentPhase} status={exp.status} />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === tabId
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview' && <ExpedientOverview exp={exp} renewMutation={renewMutation} />}
        {tab === 'checklist' && <ChecklistPanel expedientId={id} />}
        {tab === 'documents' && <DocumentPanel expedientId={id} currentPhase={exp.currentPhase} />}
        {tab === 'notifications' && <NotificationLog expedientId={id} />}
        {tab === 'history' && <PhaseHistoryTab history={exp.phaseHistory} />}
      </div>

      {/* Modal avanzar fase */}
      {advanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Avanzar de fase</h3>
            <p className="text-sm text-gray-600 mb-4">
              Fase actual: <strong>{PHASE_LABELS[exp.currentPhase]}</strong>
            </p>

            {isConditional && (
              <div className="mb-4">
                <label className="label">Decisión</label>
                <div className="flex gap-3">
                  {['SI', 'NO'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDecision(d)}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${
                        decision === d ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {d === 'SI' ? '✓ Sí' : '✗ No'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="label">Notas (opcional)</label>
              <textarea
                className="input" rows={3} placeholder="Añade notas sobre este cambio..."
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setAdvanceModal(false)} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => advanceMutation.mutate({ decision: isConditional ? decision : undefined, notes })}
                disabled={advanceMutation.isPending}
                className="btn-primary"
              >
                {advanceMutation.isPending ? 'Procesando...' : 'Confirmar avance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ExpedientOverview({ exp, renewMutation }) {
  const comercial = exp.assignments?.find(a => a.role === 'COMERCIAL')
  const firmas = exp.assignments?.find(a => a.role === 'FIRMAS')
  const marketing = exp.assignments?.find(a => a.role === 'MARKETING')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Datos del inmueble */}
      <div className="card p-5">
        <h4 className="font-semibold mb-3 text-gray-900">Datos del inmueble</h4>
        <dl className="space-y-2 text-sm">
          {[
            ['Dirección', exp.propertyAddress],
            ['Ciudad', exp.propertyCity],
            ['Referencia catastral', exp.propertyRef],
            ['Precio', exp.propertyPrice ? `${Number(exp.propertyPrice).toLocaleString('es-ES')} €` : null],
            ['Superficie', exp.propertyM2 ? `${exp.propertyM2} m²` : null],
            ['Habitaciones', exp.propertyRooms],
            ['Baños', exp.propertyBaths],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex">
              <dt className="w-36 text-gray-500 shrink-0">{k}</dt>
              <dd className="font-medium text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Datos del cliente */}
      <div className="card p-5">
        <h4 className="font-semibold mb-3 text-gray-900">Cliente</h4>
        <dl className="space-y-2 text-sm">
          {[
            ['Nombre', exp.client?.firstName
              ? `${exp.client.firstName} ${exp.client.lastName || ''}`.trim()
              : exp.client?.companyName],
            ['Email', exp.client?.email],
            ['Teléfono', exp.client?.phone],
            ['Tipo', exp.client?.type],
            ['DNI/NIF', exp.client?.dni || exp.client?.nif],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex">
              <dt className="w-28 text-gray-500 shrink-0">{k}</dt>
              <dd className="font-medium text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Responsables */}
      <div className="card p-5">
        <h4 className="font-semibold mb-3 text-gray-900">Responsables</h4>
        <div className="space-y-3">
          {[
            { label: 'Comercial', user: comercial?.user },
            { label: 'Firmas', user: firmas?.user },
            { label: 'Marketing', user: marketing?.user },
          ].map(({ label, user }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                user ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {user ? user.name.charAt(0) : '?'}
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium">{user?.name || 'Sin asignar'}</p>
                {user?.email && <p className="text-xs text-gray-400">{user.email}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exclusividad */}
      {exp.exclusivityEnd && (
        <div className="card p-5">
          <h4 className="font-semibold mb-3 text-gray-900">Exclusividad</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex">
              <dt className="w-32 text-gray-500">Inicio</dt>
              <dd>{exp.exclusivityStart ? new Date(exp.exclusivityStart).toLocaleDateString('es-ES') : '—'}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-gray-500">Fin</dt>
              <dd>{new Date(exp.exclusivityEnd).toLocaleDateString('es-ES')}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-gray-500">Duración</dt>
              <dd>{exp.exclusivityMonths} meses</dd>
            </div>
          </dl>
          <button
            onClick={() => renewMutation.mutate(3)}
            className="btn-secondary mt-3 text-xs"
          >
            <RefreshCw size={13} /> Renovar 3 meses
          </button>
        </div>
      )}

      {/* Notas */}
      {exp.notes && (
        <div className="card p-5 lg:col-span-2">
          <h4 className="font-semibold mb-2 text-gray-900">Notas</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{exp.notes}</p>
        </div>
      )}
    </div>
  )
}

function PhaseHistoryTab({ history = [] }) {
  const PHASE_LABELS = {
    CAPTACION: 'Captación', FORMULARIO: 'Formulario', DOCUMENTACION: 'Documentación',
    VALIDACION: 'Validación', ACUERDO: 'Acuerdo', MARKETING_FORMULARIO: 'Brief Mkt',
    MARKETING_EJECUCION: 'Producción Mkt', PREVENTA: 'Preventa', BUSQUEDA_ACTIVA: 'Búsqueda',
    ACUERDO_INTERESADO: 'Ac. Interesado', CIERRE: 'Cierre', POSVENTA: 'Posventa',
  }

  return (
    <div className="card p-5">
      <h4 className="font-semibold mb-4">Historial de cambios de fase</h4>
      {history.length === 0 && <p className="text-gray-400 text-sm">Sin historial</p>}
      <ol className="relative border-l border-gray-200 space-y-6">
        {history.map(entry => (
          <li key={entry.id} className="ml-4">
            <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-white bg-blue-500" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {entry.fromPhase
                  ? `${PHASE_LABELS[entry.fromPhase] || entry.fromPhase} → ${PHASE_LABELS[entry.toPhase] || entry.toPhase}`
                  : `Apertura en ${PHASE_LABELS[entry.toPhase] || entry.toPhase}`}
              </p>
              {entry.notes && <p className="text-gray-500 mt-0.5">{entry.notes}</p>}
              <p className="text-gray-400 text-xs mt-1">
                {new Date(entry.createdAt).toLocaleString('es-ES')}
                {entry.changedBy && ` · ${entry.changedBy.name}`}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
