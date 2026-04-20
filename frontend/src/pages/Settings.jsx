import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Mail, Send, Eye, Save, Settings as SettingsIcon, Briefcase, Pencil, Trash2, Plus, X, CheckCircle2, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react'
import api from '../api/client'

const TYPE_LABELS = {
  APERTURA_EXPEDIENTE: 'Apertura de expediente',
  FASE_COMPLETADA: 'Cambio de fase',
  BLOQUEO_DETECTADO: 'Expediente bloqueado',
  TAREA_COMPLETADA: 'Tarea completada',
  AVISO_PROPIETARIO: 'Aviso al propietario',
  AVISO_COMERCIAL: 'Aviso al comercial',
  RENOVAR_EXCLUSIVIDAD: 'Renovar exclusividad',
  OPERACION_CERRADA: 'Operación cerrada',
  POSVENTA_3_MESES: 'Posventa — 3 meses',
  POSVENTA_6_MESES: 'Posventa — 6 meses',
  POSVENTA_12_MESES: 'Posventa — 12 meses (solicitud de reseña)',
}

const OPERATION_ORDER = {
  VENTA: ['CAPTACION', 'VALORACION', 'FORMULARIO', 'DOCUMENTACION', 'VALIDACION', 'ACUERDO', 'MARKETING_FORMULARIO', 'MARKETING_EJECUCION', 'PREVENTA', 'BUSQUEDA_ACTIVA', 'NEGOCIACION', 'PROPUESTA', 'ARRAS', 'HIPOTECA', 'NOTARIA', 'CIERRE', 'POSVENTA'],
  COMPRA: ['CAPTACION', 'FORMULARIO', 'DOCUMENTACION', 'BUSQUEDA_ACTIVA', 'VISITAS', 'NEGOCIACION', 'ARRAS', 'HIPOTECA', 'CIERRE', 'POSVENTA'],
  INQUILINO: ['CAPTACION', 'FORMULARIO', 'DOCUMENTACION', 'VALIDACION', 'VISITAS', 'NEGOCIACION', 'ACUERDO_INTERESADO', 'CIERRE', 'POSVENTA'],
  PROPIETARIO: ['CAPTACION', 'VALORACION', 'FORMULARIO', 'DOCUMENTACION', 'ACUERDO', 'MARKETING_FORMULARIO', 'MARKETING_EJECUCION', 'VISITAS', 'NEGOCIACION', 'CIERRE', 'POSVENTA'],
  INVERSION_HOLDERS: ['CAPTACION', 'FORMULARIO', 'DOCUMENTACION', 'BUSQUEDA_ACTIVA', 'VALORACION', 'VISITAS', 'NEGOCIACION', 'ARRAS', 'CIERRE', 'POSVENTA'],
}

const PHASE_NAMES = {
  CAPTACION: 'Captación / Perfilado',
  VALORACION: 'Valoración / ROI',
  FORMULARIO: 'Ficha / Criterios',
  DOCUMENTACION: 'Documentación / KYC',
  VALIDACION: 'Validación / Solvencia',
  ACUERDO: 'Acuerdo / Mandato',
  MARKETING_FORMULARIO: 'Briefing Mkt',
  MARKETING_EJECUCION: 'Marketing activo',
  PREVENTA: 'Preventa',
  BUSQUEDA_ACTIVA: 'Búsqueda Activa',
  VISITAS: 'Visitas',
  NEGOCIACION: 'Negociación',
  PROPUESTA: 'Propuesta',
  ARRAS: 'Reserva / Arras',
  ACUERDO_INTERESADO: 'Acuerdo Inquilino',
  HIPOTECA: 'Hipoteca',
  NOTARIA: 'Notaría',
  CIERRE: 'Cierre / Contrato',
  POSVENTA: 'Cierre / Gestión',
}

// ─── Modal for creating a new checklist phase ───────────────────────────────
function NewPhaseModal({ operationType, existingPhases, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [phase, setPhase] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [saving, setSaving] = useState(false)

  // Phases already used by this operation type
  const usedPhases = existingPhases.map(t => t.phase)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return toast.error('El nombre es obligatorio')
    if (!phase.trim()) return toast.error('La fase técnica es obligatoria')
    
    // Convert custom phase to uppercase and snake_case for consistency
    const technicalPhase = isCustom 
      ? phase.trim().toUpperCase().replace(/\s+/g, '_')
      : phase

    setSaving(true)
    try {
      await api.post('/checklists/templates', {
        name: name.trim(),
        operationType,
        operationSize: 'INDIVIDUAL',
        phase: technicalPhase,
        order: 99,
        items: [{ label: 'Nueva tarea', required: true }]
      })
      toast.success('Nueva fase creada')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear la fase')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="font-bold text-[var(--text-main)]">Nueva fase de checklist</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="label">Nombre público del paso</label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Documentación adicional"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Fase técnica del proceso</label>
              <button 
                type="button" 
                onClick={() => { setIsCustom(!isCustom); setPhase('') }}
                className="text-[10px] uppercase font-bold text-blue-600 hover:underline"
              >
                {isCustom ? 'Seleccionar existente' : 'Crear nueva clave'}
              </button>
            </div>
            
            {isCustom ? (
              <input
                type="text"
                className="input font-mono uppercase"
                placeholder="ID_TECNICO (Ej: NOTARIA_2)"
                value={phase}
                onChange={e => setPhase(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              />
            ) : (
              <select
                className="select"
                value={phase}
                onChange={e => setPhase(e.target.value)}
              >
                <option value="">— Selecciona una fase —</option>
                {Object.entries(PHASE_NAMES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {key} — {label}
                    {usedPhases.includes(key) ? ' (en uso)' : ''}
                  </option>
                ))}
              </select>
            )}

            <p className="text-[10px] text-[var(--text-muted)] italic">
              * El ID técnico determina dónde se agrupan los checklists en el expediente.
            </p>

            {phase && usedPhases.includes(phase) && (
              <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Ya existe un flujo para esta fase. Se añadirán estas tareas al expediente en ese mismo punto.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-sm px-6">
              {saving ? 'Creando...' : 'Crear fase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications') // 'notifications' | 'operations'
  const [selectedId, setSelectedId] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const [newPhaseFor, setNewPhaseFor] = useState(null) // operationType string or null
  const qc = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => api.get('/email-templates').then(r => r.data),
  })

  const { data: checklistTemplates, isLoading: isLoadingChecklists } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: () => api.get('/checklists/templates').then(r => r.data),
  })

  const sendTestMutation = useMutation({
    mutationFn: () => api.post('/notifications/test', { email: testEmail }),
    onSuccess: () => toast.success(`Email de prueba enviado a ${testEmail}`),
    onError: () => toast.error('Error al enviar email de prueba'),
  })

  const selected = templates?.find(t => t.id === selectedId)

  const movePhase = async (opKey, index, direction) => {
    const opTemplates = checklistTemplates?.filter(t => t.operationType === opKey) || [];
    const sorted = [...opTemplates].sort((a,b) => (a.order || 0) - (b.order || 0));
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sorted.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const item = sorted.splice(index, 1)[0];
    sorted.splice(targetIndex, 0, item);

    const updates = sorted.map((t, i) => ({ id: t.id, order: i }));
    await api.post('/checklists/templates/bulk-order', { templates: updates });
    qc.invalidateQueries(['checklist-templates']);
    toast.success('Orden actualizado');
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'notifications' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-[var(--text-muted)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail size={16} /> Notificaciones
          </div>
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'operations' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-[var(--text-muted)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase size={16} /> Configuración Tipos de Operación
          </div>
        </button>
      </div>

      {activeTab === 'notifications' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Test email */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2">
          <Mail size={18} /> Probar sistema de email
        </h3>
        <div className="flex gap-3">
          <input
            type="email" className="input flex-1 max-w-sm"
            placeholder="email@ejemplo.com" value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
          />
          <button
            onClick={() => sendTestMutation.mutate()}
            disabled={!testEmail || sendTestMutation.isPending}
            className="btn-primary"
          >
            <Send size={15} /> Enviar test
          </button>
        </div>
      </div>

      {/* Email templates */}
      <div className="card">
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h3 className="font-semibold text-[var(--text-main)]">Plantillas de email</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Personaliza los correos automáticos. Usa <code className="bg-[var(--sidebar-bg)] px-1 rounded">{'{{variable}}'}</code> para insertar datos dinámicos.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="text-center text-gray-400 py-10">Cargando plantillas...</div>
          ) : (
            templates?.map(tpl => (
              <TemplateRow
                key={tpl.id}
                template={tpl}
                isSelected={tpl.id === selectedId}
                onSelect={() => setSelectedId(tpl.id === selectedId ? null : tpl.id)}
                onSaved={() => qc.invalidateQueries(['email-templates'])}
              />
            ))
          )}
        </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300 space-y-8">
          {isLoadingChecklists ? (
            <div className="text-center text-gray-400 py-20">Cargando flujos de trabajo...</div>
          ) : (
            Object.keys(OPERATION_ORDER).map(opKey => {
              const opTemplates = checklistTemplates?.filter(t => t.operationType === opKey) || [];
              const sortedPhases = [...opTemplates].sort((a,b) => (a.order || 0) - (b.order || 0));

              return (
                <div key={opKey} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-lg flex items-center justify-center">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-main)]">{opKey}</h3>
                        <p className="text-xs text-gray-500 uppercase">Workflow especializado</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setNewPhaseFor({ opKey, opTemplates })}
                      className="btn-secondary text-xs py-1.5"
                    >
                      <Plus size={14} /> Nueva Fase
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {sortedPhases.map((template, idx) => (
                      <PhaseEditor 
                        key={template.id} 
                        template={template} 
                        order={idx + 1}
                        onRefresh={() => qc.invalidateQueries(['checklist-templates'])}
                        onMoveUp={() => movePhase(opKey, idx, 'up')}
                        onMoveDown={() => movePhase(opKey, idx, 'down')}
                        isFirst={idx === 0}
                        isLast={idx === sortedPhases.length - 1}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Nueva Fase */}
      {newPhaseFor && (
        <NewPhaseModal
          operationType={newPhaseFor.opKey}
          existingPhases={newPhaseFor.opTemplates}
          onClose={() => setNewPhaseFor(null)}
          onCreated={() => qc.invalidateQueries(['checklist-templates'])}
        />
      )}
    </div>
  )
}

function PhaseEditor({ template, order, onRefresh, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: template.name,
    phase: template.phase,
    items: template.items.map(i => ({ ...i }))
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/checklists/templates/${template.id}`, data),
    onSuccess: () => {
      toast.success('Fase actualizada')
      setIsEditing(false)
      onRefresh()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      console.log('Solicitando borrado de plantilla:', template.id);
      return api.delete(`/checklists/templates/${template.id}`);
    },
    onSuccess: () => {
      toast.success('Fase eliminada')
      onRefresh()
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'No se pudo eliminar la fase. Puede que esté en uso en algún expediente.')
    }
  })

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { label: 'Nueva tarea', required: true }]
    })
  }

  const removeItem = (idx) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx)
    })
  }

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items]
    newItems[idx][field] = value
    setFormData({ ...formData, items: newItems })
  }

  if (!isEditing) {
    return (
      <div className="card overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <div className="px-5 py-3 bg-[var(--bg-color)]/50 flex items-center justify-between border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {order}
            </span>
            <span className="font-semibold text-[var(--text-main)] text-sm">{template.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-mono tracking-widest mr-4">{template.phase}</span>
            
            <div className="flex border-r border-[var(--border-color)] pr-2 mr-2 gap-1">
              <button 
                onClick={onMoveUp} disabled={isFirst}
                className={`p-1 rounded hover:bg-[var(--sidebar-bg)] ${isFirst ? 'opacity-20 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600'}`}
              >
                <ChevronUp size={14} />
              </button>
              <button 
                onClick={onMoveDown} disabled={isLast}
                className={`p-1 rounded hover:bg-[var(--sidebar-bg)] ${isLast ? 'opacity-20 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600'}`}
              >
                <ChevronDown size={14} />
              </button>
            </div>

            <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-[var(--sidebar-bg)]">
              <Pencil size={14} />
            </button>
            <button 
              onClick={() => deleteMutation.mutate()} 
              disabled={deleteMutation.isPending}
              className={`p-1.5 rounded-lg hover:bg-[var(--sidebar-bg)] transition-colors ${
                deleteMutation.isPending ? 'opacity-30 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'
              }`}
            >
              <Trash2 size={14} className={deleteMutation.isPending ? 'animate-pulse' : ''} />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          {template.items.map(item => (
            <div key={item.id} className="flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-1 text-gray-300" />
              <p className="text-sm text-[var(--text-muted)] truncate">
                {item.label}
                {item.required && <span className="text-red-400 ml-1">*</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden border-2 border-blue-500 bg-[var(--card-bg)] shadow-xl animate-in zoom-in-95 duration-200">
      <div className="px-5 py-4 bg-[var(--sidebar-bg)] border-b border-blue-100 space-y-3">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">Nombre de la Fase</label>
            <input 
              type="text" className="input bg-[var(--card-bg)] text-sm" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div className="w-64">
            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">ID Técnico (Fase)</label>
            <div className="flex gap-2">
              <input 
                type="text" className="input bg-[var(--card-bg)] text-sm font-mono uppercase" 
                value={formData.phase} onChange={e => setFormData({...formData, phase: e.target.value.toUpperCase().replace(/\s+/g, '_')})} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-bold text-[var(--text-muted)]">Tareas del Checklist</h5>
          <button onClick={addItem} className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:underline">
            <Plus size={14} /> Añadir tarea
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {formData.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-center group">
              <input 
                type="text" className="input text-sm py-1.5" 
                value={item.label} onChange={e => updateItem(idx, 'label', e.target.value)} 
              />
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input 
                  type="checkbox" checked={item.required} 
                  onChange={e => updateItem(idx, 'required', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500 font-medium">Req.</span>
              </label>
              <button onClick={() => removeItem(idx)} className="p-1.5 text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t flex justify-end gap-3">
          <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs">Cancelar</button>
          <button 
            onClick={() => updateMutation.mutate(formData)} 
            disabled={updateMutation.isPending}
            className="btn-primary text-xs"
          >
            <Save size={14} /> {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TemplateRow({ template, isSelected, onSelect, onSaved }) {
  const [subject, setSubject] = useState(template.subject)
  const [bodyHtml, setBodyHtml] = useState(template.bodyHtml)
  const [preview, setPreview] = useState(null)
  const qc = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/email-templates/${template.id}`, { subject, bodyHtml }),
    onSuccess: () => { toast.success('Plantilla guardada'); onSaved() },
  })

  const previewMutation = useMutation({
    mutationFn: () => api.post(`/email-templates/${template.id}/preview`),
    onSuccess: (res) => setPreview(res.data),
  })

  return (
    <div className="border-b border-[var(--border-color)] last:border-0">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[var(--bg-color)]"
        onClick={onSelect}
      >
        <div>
          <p className="font-medium text-sm text-[var(--text-main)]">{TYPE_LABELS[template.type] || template.type}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xl">{template.subject}</p>
        </div>
        <span className={`badge ${template.active ? 'bg-green-500/20 text-green-400' : 'bg-[var(--sidebar-bg)] text-gray-500'} text-xs`}>
          {template.active ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {isSelected && (
        <div className="px-5 pb-5 space-y-4 bg-[var(--bg-color)]">
          <div>
            <label className="label">Asunto</label>
            <input type="text" className="input" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Cuerpo HTML</label>
            <textarea
              className="input font-mono text-xs" rows={12}
              value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Variables disponibles: {template.variables?.map(v => `{{${v}}}`).join(', ')}
            </p>
          </div>

          {preview && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-[var(--sidebar-bg)] px-3 py-1.5 text-xs text-[var(--text-muted)] font-medium border-b border-[var(--border-color)]">
                Vista previa: {preview.subject}
              </div>
              <div
                className="p-4 text-sm bg-[var(--card-bg)] max-h-64 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
              />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => previewMutation.mutate()} className="btn-secondary text-xs">
              <Eye size={13} /> Vista previa
            </button>
            <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary text-xs">
              <Save size={13} /> {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
