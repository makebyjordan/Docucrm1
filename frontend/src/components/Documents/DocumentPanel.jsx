import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Upload, FileText, CheckCircle, XCircle, Clock,
  Download, Trash2, ExternalLink, Info, AlertCircle, Eye, Plus
} from 'lucide-react'
import api from '../../api/client'

const STATUS_CONFIG = {
  PENDIENTE: { label: 'Completado', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  SUBIDO:    { label: 'Subido', icon: FileText, color: 'text-blue-500 bg-blue-50' },
  VALIDADO:  { label: 'Validado', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  RECHAZADO: { label: 'Rechazado', icon: XCircle, color: 'text-red-500 bg-red-50' },
}

// ─── Definición de documentos necesarios por flujo ────────────────────────────
const REQUIRED_DOCS = {
  VENTA: [
    { type: 'DNI_NIE', label: 'DNI / NIE Vendedor', description: 'Documento vigente de todos los propietarios' },
    { type: 'ESCRITURA', label: 'Escritura de Propiedad', description: 'Título de propiedad del inmueble' },
    { type: 'NOTA_SIMPLE', label: 'Nota Simple Registral', description: 'Menos de 3 meses de antigüedad' },
    { type: 'IBI', label: 'Último recibo IBI', description: 'Justificante de pago del año en curso' },
    { type: 'CERTIFICADO_ENERGETICO', label: 'Certificado Energético', description: 'Etiqueta y registro oficial' },
    { type: 'CEDULA_HABITABILIDAD', label: 'Cédula de Habitabilidad', description: 'En vigor (si aplica)' },
    { type: 'DEUDAS_COMUNIDAD', label: 'Certificado de Deudas', description: 'Emitido por el administrador' },
  ],
  COMPRA: [
    { type: 'DNI_NIE', label: 'DNI / NIE Comprador', description: 'Documento vigente' },
    { type: 'NOMINAS', label: 'Últimas 3 Nóminas', description: 'Justificante de ingresos' },
    { type: 'IRPF', label: 'Declaración IRPF', description: 'Último ejercicio presentado' },
    { type: 'CIRBE', label: 'Informe CIRBE', description: 'Central de riesgos del Banco de España' },
    { type: 'VIDA_LABORAL', label: 'Vida Laboral', description: 'Actualizada a la fecha' },
    { type: 'EXTRACTOS_BANCO', label: 'Extractos Bancarios', description: 'Últimos 6 meses de movimientos' },
  ],
  ALQUILER: [
    { type: 'DNI_NIE', label: 'DNI / NIE Propietante', description: 'Documento vigente' },
    { type: 'ESCRITURA', label: 'Escritura / Título', description: 'Para acreditar la titularidad' },
    { type: 'CEDULA_HABITABILIDAD', label: 'Cédula de Habitabilidad', description: 'Vigente y válida' },
    { type: 'CERTIFICADO_ENERGETICO', label: 'Certificado Energético', description: 'Obligatorio para alquilar' },
  ],
  INVERSION: [
    { type: 'DNI_PASAPORTE', label: 'DNI / Pasaporte representante', description: 'Vigente' },
    { type: 'CIF_EMPRESA', label: 'CIF Empresa', description: 'Si la inversión es societaria' },
    { type: 'ESCRITURAS_SOCIEDAD', label: 'Escrituras Constitución', description: 'Y poderes de representación' },
    { type: 'DUE_DILIGENCE', label: 'Informe Due Diligence', description: 'Auditoría técnica / legal' },
    { type: 'TASACION_OFICIAL', label: 'Tasación Oficial', description: 'Para valoración de activos' },
  ]
}

export default function DocumentPanel({ expedientId, currentPhase, operationType }) {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('OTRO')
  const [docName, setDocName] = useState('')
  const [selectedNeeded, setSelectedNeeded] = useState(null)

  const { data: documents, isLoading: docLoading } = useQuery({
    queryKey: ['documents', expedientId],
    queryFn: () => api.get(`/documents/expedient/${expedientId}`).then(r => r.data),
  })

  const { data: checklists, isLoading: checkLoading } = useQuery({
    queryKey: ['checklists', expedientId],
    queryFn: () => api.get(`/checklists/expedient/${expedientId}`).then(r => r.data),
  })

  const currentChecklist = checklists?.find(c => c.phase === currentPhase)
  const neededDocs = REQUIRED_DOCS[operationType] || []

  // Mapeo de documentos subidos por tipo
  const uploadedTypes = (documents || []).reduce((acc, doc) => {
    acc[doc.docType] = true
    return acc
  }, {})

  // Mapeo de ítems del checklist para ver cuáles ya están ahí
  const checklistLabels = (currentChecklist?.items || []).map(i => i.label.toLowerCase())

  const addItemToChecklist = useMutation({
    mutationFn: (label) => api.post(`/checklists/instance/${currentChecklist.id}/items`, { label, required: true }),
    onSuccess: () => {
      toast.success('Añadido al checklist')
      qc.invalidateQueries(['checklists', expedientId])
      qc.invalidateQueries(['expedient', expedientId])
    }
  })

  const syncAllToChecklist = () => {
    if (!currentChecklist) return toast.error('No hay checklist activo en esta fase')
    const toAdd = neededDocs.filter(doc => !uploadedTypes[doc.type] && !checklistLabels.includes(doc.label.toLowerCase()))
    if (toAdd.length === 0) return toast.success('Ya están todos en el checklist')
    
    Promise.all(toAdd.map(doc => addItemToChecklist.mutateAsync(doc.label)))
      .then(() => toast.success('Requisitos sincronizados'))
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    // Si venimos de un placeholder "Necesario", usamos ese tipo
    const finalType = selectedNeeded ? selectedNeeded.type : docType
    const finalName = selectedNeeded ? selectedNeeded.label : (docName || file.name)

    formData.append('docType', finalType)
    formData.append('name', finalName)
    formData.append('phase', currentPhase)

    try {
      await api.post(`/documents/expedient/${expedientId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Documento subido correctamente')
      qc.invalidateQueries(['documents', expedientId])
      setDocName('')
      setSelectedNeeded(null)
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

  if (docLoading || checkLoading) return <div className="text-gray-400 text-center py-10">Cargando documentos...</div>

  // Documentos subidos agrupados
  const grouped = (documents || []).reduce((acc, doc) => {
    const key = doc.docType || 'OTRO'
    acc[key] = acc[key] || []
    acc[key].push(doc)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Columna Izquierda: Documentación Necesaria */}
      <div className="lg:col-span-1 space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Info className="text-blue-500" size={18} />
              <h4 className="font-semibold text-gray-900 text-sm">Documentación Necesaria</h4>
            </div>
            {currentChecklist && (
              <button 
                onClick={syncAllToChecklist}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                title="Añadir requisitos pendientes al checklist de esta fase"
              >
                <Plus size={12} /> Sincronizar
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mb-4 bg-gray-50 p-2 rounded italic">
            Basado en un flujo de <strong className="text-blue-600">{operationType}</strong>
          </p>

          <div className="space-y-2">
            {neededDocs.map(doc => {
              const isUploaded = uploadedTypes[doc.type]
              return (
                <div key={doc.type}
                  className={`p-3 rounded-xl border transition-all ${isUploaded ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'
                    }`}
                >
                    <div className="flex items-center gap-2">
                      {isUploaded ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <AlertCircle size={14} className="text-gray-300" />
                      )}
                      <span className={`text-xs font-bold ${isUploaded ? 'text-green-700' : 'text-gray-700'}`}>
                        {doc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isUploaded && !checklistLabels.includes(doc.label.toLowerCase()) && (
                        <button 
                          onClick={() => addItemToChecklist.mutate(doc.label)}
                          className="p-1 hover:text-blue-600 text-gray-400 transition-colors"
                          title="Añadir tarea al checklist"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                      {!isUploaded && (
                        <button
                          onClick={() => {
                            setSelectedNeeded(doc)
                            fileRef.current?.click()
                          }}
                          className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Subir
                        </button>
                      )}
                    </div>
                  <p className="text-[10px] text-gray-500 mt-1 pl-5">{doc.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Gestor de Archivos */}
      <div className="lg:col-span-2 space-y-4">

        {/* Upload zone */}
        <div className="card p-5">
          <h4 className="font-semibold mb-3 text-gray-900 text-sm">Subir otro documento</h4>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-40">
              <label className="label text-xs">Nombre descriptivo</label>
              <input
                type="text" className="input text-sm py-1.5" placeholder="Ej: Nota simple ayer"
                value={docName} onChange={e => setDocName(e.target.value)}
              />
            </div>
            <div>
              <label className="label text-xs">Tipo</label>
              <select className="select text-sm py-1" value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="OTRO">OTRO</option>
                {neededDocs.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                <option value="NOMINAS">NOMINAS</option>
                <option value="CONTRATO">CONTRATO</option>
                <option value="ARRAS">ARRAS</option>
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                setSelectedNeeded(null)
                fileRef.current?.click()
              }}
              disabled={uploading}
            >
              <Upload size={15} />
              {uploading ? 'Subiendo...' : 'Subir'}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
          </div>
        </div>

        {/* Document list agrupado */}
        <div className="space-y-3">
          {Object.entries(grouped).map(([type, docs]) => (
            <div key={type} className="card overflow-hidden">
              <div className="px-5 py-2 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">
                  {type.replace(/_/g, ' ')}
                </h5>
                <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border">
                  {docs.length} {docs.length === 1 ? 'archivo' : 'archivos'}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {docs.map(doc => {
                  const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDIENTE
                  const Icon = cfg.icon

                  return (
                    <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/30 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`text-[10px] font-bold ${cfg.color.split(' ')[0]}`}>{cfg.label}</span>
                          <span className="text-[10px] text-gray-400 capitalize">{doc.phase.toLowerCase()}</span>
                          {doc.rejectedReason && (
                            <span className="text-[10px] text-red-500 font-medium">Motivo: {doc.rejectedReason}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            const token = localStorage.getItem('crm_token');
                            window.open(`/api/documents/${doc.id}/preview?token=${token}`, '_blank');
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                          title="Ver documento"
                        >
                          <Eye size={15} />
                        </button>
                        {doc.driveUrl && (
                          <a href={doc.driveUrl} target="_blank" rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                            title="Ver en Google Drive"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                          title="Descargar"
                        >
                          <Download size={15} />
                        </a>
                        {doc.status === 'SUBIDO' && (
                          <>
                            <button onClick={() => validateMutation.mutate(doc.id)}
                              className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-all"
                              title="Validar"
                            >
                              <CheckCircle size={15} />
                            </button>
                            <button onClick={() => {
                              const reason = prompt('Motivo del rechazo:')
                              if (reason) rejectMutation.mutate({ docId: doc.id, reason })
                            }}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                              title="Rechazar"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        <button onClick={() => {
                          if (confirm('¿Eliminar este documento?')) deleteMutation.mutate(doc.id)
                        }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {(documents || []).length === 0 && (
            <div className="card p-12 text-center border-dashed border-2 border-gray-200">
              <FileText size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">Gestor de archivos vacío</p>
              <p className="text-[10px] text-gray-300 mt-1">Usa la columna de la izquierda para subir la documentación necesaria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
