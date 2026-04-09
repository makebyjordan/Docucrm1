import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Upload, FileText, CheckCircle, XCircle, Clock,
  Download, Trash2, ExternalLink,
} from 'lucide-react'
import api from '../../api/client'

const STATUS_CONFIG = {
  PENDIENTE: { label: 'Pendiente', icon: Clock, color: 'text-yellow-500 bg-yellow-50' },
  SUBIDO:    { label: 'Subido', icon: FileText, color: 'text-blue-500 bg-blue-50' },
  VALIDADO:  { label: 'Validado', icon: CheckCircle, color: 'text-green-500 bg-green-50' },
  RECHAZADO: { label: 'Rechazado', icon: XCircle, color: 'text-red-500 bg-red-50' },
}

const DOC_TYPES = [
  'DNI_NIE', 'ESCRITURA', 'NOTA_SIMPLE', 'IBI', 'CERTIFICADO_ENERGETICO',
  'CEDULA_HABITABILIDAD', 'DEUDAS_COMUNIDAD', 'CONTRATO', 'ARRAS',
  'NOMINAS', 'EXTRACTOS_BANCO', 'HIPOTECA', 'DUE_DILIGENCE', 'OTRO',
]

export default function DocumentPanel({ expedientId, currentPhase }) {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('OTRO')
  const [docName, setDocName] = useState('')

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', expedientId],
    queryFn: () => api.get(`/documents/expedient/${expedientId}`).then(r => r.data),
  })

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('docType', docType)
    formData.append('name', docName || file.name)
    formData.append('phase', currentPhase)

    try {
      await api.post(`/documents/expedient/${expedientId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Documento subido correctamente')
      qc.invalidateQueries(['documents', expedientId])
      setDocName('')
    } catch {
      toast.error('Error al subir el documento')
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  const validateMutation = useMutation({
    mutationFn: (docId) => api.put(`/documents/${docId}/validate`),
    onSuccess: () => { toast.success('Documento validado'); qc.invalidateQueries(['documents', expedientId]) },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ docId, reason }) => api.put(`/documents/${docId}/reject`, { rejectedReason: reason }),
    onSuccess: () => { toast.success('Documento rechazado'); qc.invalidateQueries(['documents', expedientId]) },
  })

  const deleteMutation = useMutation({
    mutationFn: (docId) => api.delete(`/documents/${docId}`),
    onSuccess: () => qc.invalidateQueries(['documents', expedientId]),
  })

  if (isLoading) return <div className="text-gray-400 text-center py-10">Cargando documentos...</div>

  // Agrupar por tipo
  const grouped = (documents || []).reduce((acc, doc) => {
    const key = doc.docType || 'OTRO'
    acc[key] = acc[key] || []
    acc[key].push(doc)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div className="card p-5">
        <h4 className="font-semibold mb-3 text-gray-900">Subir documento</h4>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-40">
            <label className="label">Nombre del documento</label>
            <input
              type="text" className="input" placeholder="Ej: DNI García Juan"
              value={docName} onChange={e => setDocName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="select" value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={15} />
            {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
        </div>
      </div>

      {/* Document list */}
      {Object.entries(grouped).map(([type, docs]) => (
        <div key={type} className="card overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h5 className="font-semibold text-sm text-gray-700">{type.replace(/_/g, ' ')}</h5>
          </div>
          <div className="divide-y divide-gray-100">
            {docs.map(doc => {
              const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDIENTE
              const Icon = cfg.icon

              return (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`badge text-xs ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-gray-400">{doc.phase}</span>
                      {doc.rejectedReason && (
                        <span className="text-xs text-red-500">— {doc.rejectedReason}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.driveUrl && (
                      <a href={doc.driveUrl} target="_blank" rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                      <Download size={15} />
                    </a>
                    {doc.status === 'SUBIDO' && (
                      <>
                        <button onClick={() => validateMutation.mutate(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-green-600 rounded">
                          <CheckCircle size={15} />
                        </button>
                        <button onClick={() => {
                          const reason = prompt('Motivo del rechazo:')
                          if (reason) rejectMutation.mutate({ docId: doc.id, reason })
                        }} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <XCircle size={15} />
                        </button>
                      </>
                    )}
                    <button onClick={() => {
                      if (confirm('¿Eliminar este documento?')) deleteMutation.mutate(doc.id)
                    }} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div className="card p-8 text-center">
          <FileText size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No hay documentos subidos todavía</p>
        </div>
      )}
    </div>
  )
}
