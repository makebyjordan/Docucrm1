import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, Plus, X, ArrowRight, Search, AlertTriangle, ShieldCheck, Edit2, Info } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'

const LINK_TYPES = {
  VENDE_PARA_COMPRAR:  { label: 'Vende para comprar',   color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  COMPRA_PARA_VENDER:  { label: 'Compra para vender',   color: 'text-green-400',  bg: 'bg-green-400/10' },
  PERMUTA_MUTUA:       { label: 'Permuta mutua',         color: 'text-purple-400', bg: 'bg-purple-400/10' },
  CADENA:              { label: 'Cadena de operaciones', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  RELACIONADO:         { label: 'Relacionado',           color: 'text-gray-400',   bg: 'bg-gray-400/10' },
}

const PHASE_OPTIONS = [
  'CAPTACION','VALORACION','FORMULARIO','DOCUMENTACION','VALIDACION','ACUERDO',
  'VISITAS','PREVENTA','BUSQUEDA_ACTIVA','NEGOCIACION','ACUERDO_INTERESADO',
  'ARRAS','HIPOTECA','NOTARIA','CIERRE',
]

function LinkBadge({ linkType }) {
  const t = LINK_TYPES[linkType] || LINK_TYPES.RELACIONADO
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${t.color} ${t.bg}`}>
      {t.label}
    </span>
  )
}

function LinkCard({ link, direction, onEdit, onDelete }) {
  const exp = direction === 'out' ? link.linkedExpedient : link.expedient
  const clientName = exp?.client?.firstName
    ? `${exp.client.firstName} ${exp.client.lastName || ''}`.trim()
    : exp?.client?.companyName || 'Sin cliente'

  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] group">
      <div className="flex items-center gap-3 p-3">
        <div className={`w-2 h-8 rounded-full shrink-0 ${
          exp?.status === 'BLOQUEADO' ? 'bg-red-500' :
          exp?.status === 'COMPLETADO' ? 'bg-blue-500' : 'bg-green-500'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-[var(--primary-color)]">{exp?.code}</span>
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--sidebar-bg)] px-1.5 py-0.5 rounded">
              {exp?.operationType}
            </span>
            <LinkBadge linkType={link.linkType} />
            {link.isBlocking && (
              <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle size={9} /> Bloqueante
              </span>
            )}
            {!link.isBlocking && (
              <span className="text-[10px] text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck size={9} /> Informativo
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-main)] truncate mt-0.5">{clientName}</p>
          {exp?.propertyAddress && (
            <p className="text-xs text-[var(--text-muted)] truncate">{exp.propertyAddress}</p>
          )}
          {link.isBlocking && link.requiredPhase && (
            <p className="text-[10px] text-yellow-500 mt-0.5">
              Requiere fase: <strong>{link.requiredPhase}</strong> · Actual: <strong>{exp?.currentPhase}</strong>
            </p>
          )}
          {link.condition && (
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 italic">"{link.condition}"</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <RouterLink to={`/expedients/${exp?.id}`} className="p-1.5 text-gray-400 hover:text-[var(--primary-color)]">
            <ArrowRight size={13} />
          </RouterLink>
          {direction === 'out' && (
            <>
              <button onClick={() => onEdit(link)} className="p-1.5 text-gray-400 hover:text-blue-400">
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(link.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                <X size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateLinkModal({ expedientId, onClose, onSuccess }) {
  const [search, setSearch] = useState('')
  const [step, setStep] = useState('search')
  const [selectedExp, setSelectedExp] = useState(null)
  const [form, setForm] = useState({
    linkType: 'RELACIONADO',
    linkDirection: 'UNIDIRECCIONAL',
    isBlocking: false,
    requiredPhase: '',
    condition: '',
    notes: '',
  })

  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['exp-search-links', search],
    queryFn: () => api.get(`/expedients?search=${search}&limit=10`).then(r => r.data),
    enabled: search.length > 2,
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/expedients/${expedientId}/links`, data),
    onSuccess: () => { toast.success('Vínculo creado'); onSuccess() },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al crear vínculo'),
  })

  const results = (searchResult?.data || []).filter(e => e.id !== expedientId)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-[var(--text-main)]">Crear vínculo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[var(--text-muted)]"><X size={20} /></button>
        </div>

        {step === 'search' ? (
          <div className="space-y-4">
            <div>
              <label className="label">Buscar expediente a vincular</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" className="input pl-8"
                  placeholder="Código, dirección o cliente..."
                  value={search} onChange={e => setSearch(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border border-[var(--border-color)] rounded-lg divide-y divide-[var(--border-color)]">
              {isLoading && <div className="p-4 text-center text-xs text-gray-400">Buscando...</div>}
              {!isLoading && search.length > 2 && results.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400">No se encontraron expedientes</div>
              )}
              {!search && <div className="p-4 text-center text-xs text-gray-400">Escribe al menos 3 caracteres</div>}
              {results.map(e => {
                const name = e.client?.firstName
                  ? `${e.client.firstName} ${e.client.lastName || ''}`.trim()
                  : e.client?.companyName || ''
                return (
                  <div key={e.id} className="flex items-center justify-between p-3 hover:bg-[var(--bg-color)] cursor-pointer"
                    onClick={() => { setSelectedExp(e); setStep('config') }}>
                    <div>
                      <p className="text-sm font-medium">
                        <span className="font-mono text-[var(--primary-color)]">{e.code}</span> · {name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{e.operationType} · {e.currentPhase} · {e.propertyAddress || 'Sin dirección'}</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-400" />
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[var(--sidebar-bg)] border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">Expediente seleccionado</p>
              <p className="font-mono text-sm font-bold text-[var(--primary-color)]">{selectedExp?.code}</p>
              <p className="text-xs text-[var(--text-muted)]">{selectedExp?.operationType} · {selectedExp?.currentPhase}</p>
            </div>

            <div>
              <label className="label">Tipo de vínculo</label>
              <select className="select" value={form.linkType} onChange={e => setForm(f => ({ ...f, linkType: e.target.value }))}>
                {Object.entries(LINK_TYPES).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Dirección</label>
              <select className="select" value={form.linkDirection} onChange={e => setForm(f => ({ ...f, linkDirection: e.target.value }))}>
                <option value="UNIDIRECCIONAL">Unidireccional (este → vinculado)</option>
                <option value="BIDIRECCIONAL">Bidireccional (mutuo)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] cursor-pointer"
              onClick={() => setForm(f => ({ ...f, isBlocking: !f.isBlocking }))}>
              <input type="checkbox" checked={form.isBlocking} onChange={() => {}} className="w-4 h-4 accent-red-500" />
              <div>
                <p className="text-sm font-medium text-[var(--text-main)]">Vínculo bloqueante</p>
                <p className="text-xs text-[var(--text-muted)]">Impide avanzar de fase hasta que el expediente vinculado alcance la fase requerida</p>
              </div>
            </div>

            {form.isBlocking && (
              <div>
                <label className="label">Fase mínima requerida en el expediente vinculado</label>
                <select className="select" value={form.requiredPhase} onChange={e => setForm(f => ({ ...f, requiredPhase: e.target.value }))}>
                  <option value="">Sin restricción de fase</option>
                  {PHASE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="label">Condición (opcional)</label>
              <input type="text" className="input" placeholder="Ej: Supeditado al cierre de la venta actual"
                value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} />
            </div>

            <div>
              <label className="label">Notas (opcional)</label>
              <textarea className="input resize-none" rows={2} placeholder="Observaciones sobre este vínculo"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep('search')} className="btn-secondary flex-1">Atrás</button>
              <button
                onClick={() => mutation.mutate({ linkedExpedientId: selectedExp.id, ...form, requiredPhase: form.requiredPhase || null, condition: form.condition || null, notes: form.notes || null })}
                disabled={mutation.isPending}
                className="btn-primary flex-1"
              >
                {mutation.isPending ? 'Creando...' : 'Crear vínculo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EditLinkModal({ link, onClose, onSuccess }) {
  const [form, setForm] = useState({
    linkType: link.linkType,
    isBlocking: link.isBlocking,
    requiredPhase: link.requiredPhase || '',
    condition: link.condition || '',
    notes: link.notes || '',
  })

  const mutation = useMutation({
    mutationFn: (data) => api.patch(`/expedients/links/${link.id}`, data),
    onSuccess: () => { toast.success('Vínculo actualizado'); onSuccess() },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al actualizar'),
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--text-main)]">Editar vínculo</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Tipo</label>
            <select className="select" value={form.linkType} onChange={e => setForm(f => ({ ...f, linkType: e.target.value }))}>
              {Object.entries(LINK_TYPES).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, isBlocking: !f.isBlocking }))}>
            <input type="checkbox" checked={form.isBlocking} onChange={() => {}} className="w-4 h-4 accent-red-500" />
            <span className="text-sm text-[var(--text-main)]">Bloqueante</span>
          </div>
          {form.isBlocking && (
            <div>
              <label className="label">Fase requerida</label>
              <select className="select" value={form.requiredPhase} onChange={e => setForm(f => ({ ...f, requiredPhase: e.target.value }))}>
                <option value="">Sin restricción</option>
                {PHASE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Condición</label>
            <input type="text" className="input" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={() => mutation.mutate({ ...form, requiredPhase: form.requiredPhase || null, condition: form.condition || null })}
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LinkedExpedientsPanel({ expedientId }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editLink, setEditLink] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['links', expedientId],
    queryFn: () => api.get(`/expedients/${expedientId}/links`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (linkId) => api.delete(`/expedients/links/${linkId}`),
    onSuccess: () => { toast.success('Vínculo eliminado'); qc.invalidateQueries(['links', expedientId]) },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })

  const refresh = () => qc.invalidateQueries(['links', expedientId])

  if (isLoading) return <div className="p-10 text-center text-gray-400">Cargando vínculos...</div>

  const outgoing = data?.outgoing || []
  const incoming = data?.incoming || []
  const blockingCount = outgoing.filter(l => l.isBlocking).length

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
              <Link2 size={16} className="text-[var(--primary-color)]" />
              Vínculos avanzados
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Expedientes relacionados con lógica de bloqueo y condiciones
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
            <Plus size={13} /> Crear vínculo
          </button>
        </div>

        {blockingCount > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400">
              <strong>{blockingCount} vínculo{blockingCount > 1 ? 's' : ''} bloqueante{blockingCount > 1 ? 's' : ''}</strong> activo{blockingCount > 1 ? 's' : ''}.
              El avance de fase puede estar restringido hasta que los expedientes vinculados alcancen la fase requerida.
            </p>
          </div>
        )}

        {/* Vínculos salientes */}
        {outgoing.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              Este expediente vincula a ({outgoing.length})
            </p>
            <div className="space-y-2">
              {outgoing.map(link => (
                <LinkCard key={link.id} link={link} direction="out"
                  onEdit={setEditLink}
                  onDelete={(id) => { if (confirm('¿Eliminar este vínculo?')) deleteMutation.mutate(id) }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Vínculos entrantes */}
        {incoming.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              Vinculado desde ({incoming.length})
            </p>
            <div className="space-y-2">
              {incoming.map(link => (
                <LinkCard key={link.id} link={link} direction="in" onEdit={() => {}} onDelete={() => {}} />
              ))}
            </div>
          </div>
        )}

        {outgoing.length === 0 && incoming.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-[var(--border-color)] rounded-xl">
            <Link2 size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Sin vínculos entre expedientes</p>
            <p className="text-xs text-gray-300 mt-1">
              Vincula operaciones encadenadas, permutas o condicionadas
            </p>
          </div>
        )}
      </div>

      {/* Info de tipos */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Info size={11} /> Tipos de vínculo disponibles
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(LINK_TYPES).map(([key, { label, color, bg }]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${color} ${bg}`}>{label}</span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {key === 'VENDE_PARA_COMPRAR' && 'El cliente vende este inmueble para financiar la compra del otro.'}
                {key === 'COMPRA_PARA_VENDER' && 'Se compra este inmueble condicionado a la venta del otro.'}
                {key === 'PERMUTA_MUTUA' && 'Intercambio de inmuebles entre las partes.'}
                {key === 'CADENA' && 'Operación parte de una cadena de compra-ventas sucesivas.'}
                {key === 'RELACIONADO' && 'Relación informativa sin condiciones de bloqueo.'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateLinkModal expedientId={expedientId} onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); refresh() }} />
      )}
      {editLink && (
        <EditLinkModal link={editLink} onClose={() => setEditLink(null)}
          onSuccess={() => { setEditLink(null); refresh() }} />
      )}
    </div>
  )
}
