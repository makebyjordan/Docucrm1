import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Mail, Send, Eye, Save } from 'lucide-react'
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

export default function SettingsPage() {
  const [selectedId, setSelectedId] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const qc = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => api.get('/email-templates').then(r => r.data),
  })

  const sendTestMutation = useMutation({
    mutationFn: () => api.post('/notifications/test', { email: testEmail }),
    onSuccess: () => toast.success(`Email de prueba enviado a ${testEmail}`),
    onError: () => toast.error('Error al enviar email de prueba'),
  })

  const selected = templates?.find(t => t.id === selectedId)

  return (
    <div className="space-y-6">
      {/* Test email */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Plantillas de email</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Personaliza los correos automáticos. Usa <code className="bg-gray-100 px-1 rounded">{'{{variable}}'}</code> para insertar datos dinámicos.
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
    <div className="border-b border-gray-100 last:border-0">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50"
        onClick={onSelect}
      >
        <div>
          <p className="font-medium text-sm text-gray-900">{TYPE_LABELS[template.type] || template.type}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xl">{template.subject}</p>
        </div>
        <span className={`badge ${template.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} text-xs`}>
          {template.active ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {isSelected && (
        <div className="px-5 pb-5 space-y-4 bg-gray-50">
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
              <div className="bg-gray-200 px-3 py-1.5 text-xs text-gray-600 font-medium">
                Vista previa: {preview.subject}
              </div>
              <div
                className="p-4 text-sm bg-white max-h-64 overflow-y-auto"
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
