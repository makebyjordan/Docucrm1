import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { 
  FileText, Plus, Search, Trash2, ExternalLink, 
  FileIcon, Filter, Upload, X, Pencil, Download, Building2
} from 'lucide-react'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function BaseDocuments() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  
  const token = useAuthStore(s => s.token)

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['base-documents'],
    queryFn: () => api.get('/base-documents').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/base-documents/${id}`),
    onSuccess: () => {
      toast.success('Documento eliminado')
      qc.invalidateQueries(['base-documents'])
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/base-documents/${id}`, data),
    onSuccess: () => {
      toast.success('Documento actualizado')
      setEditingDoc(null)
      qc.invalidateQueries(['base-documents'])
    },
  })

  const filteredDocs = (Array.isArray(docs) ? docs : []).filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'ALL' || d.category === category
    return matchSearch && matchCat
  })

  if (isLoading) return <div className="p-10 text-center text-gray-400 font-mono animate-pulse">Cargando repositorio de documentos...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Repositorio de Documentos</h1>
          <p className="text-gray-500 text-sm">Gestiona plantillas y documentos base para toda la organización</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center justify-center gap-2 group"
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          <span>Nuevo documento base</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" className="input pl-10 h-11" placeholder="Buscar por nombre..." 
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <select 
            className="select pl-10 h-11" 
            value={category} onChange={e => setCategory(e.target.value)}
          >
            <option value="ALL">Todas las categorías</option>
            <option value="VENTA">Ventas</option>
            <option value="ALQUILER">Alquileres</option>
            <option value="GENERAL">General / Oficina</option>
            <option value="LEGAL">Legal / LOPD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="group bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {doc.driveUrl && (
                  <a href={doc.driveUrl} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600">
                    <ExternalLink size={16} />
                  </a>
                )}
                <button 
                  onClick={() => setEditingDoc(doc)}
                  className="p-1.5 text-gray-400 hover:text-blue-600"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => { if(confirm('¿Eliminar documento base?')) deleteMutation.mutate(doc.id) }}
                  className="p-1.5 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{doc.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{doc.category}</span>
                <span className="text-[10px] text-gray-400">{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ''}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-gray-50">
              <div className="flex gap-2">
                <button 
                  onClick={() => setPreviewUrl(`/api/base-documents/${doc.id}/preview?token=${token}`)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={12} /> Ver local
                </button>
                <a 
                  href={`/api/base-documents/${doc.id}/download?token=${token}`}
                  download
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-[10px] font-bold transition-colors"
                >
                  <Download size={12} /> Bajar
                </a>
              </div>
              {doc.driveUrl && (
                <a 
                  href={doc.driveUrl} 
                  target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                >
                  <Building2 size={12} /> Abrir en Google Drive
                </a>
              )}
            </div>
          </div>
        ))}
        
        {filteredDocs.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
            <FileIcon className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-400 font-medium">No se encontraron documentos</p>
            <p className="text-gray-300 text-sm">Prueba con otra búsqueda o añade uno nuevo</p>
          </div>
        )}
      </div>

      {showUploadModal && (
        <UploadBaseModal 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={() => { setShowUploadModal(false); qc.invalidateQueries(['base-documents']) }} 
        />
      )}

      {editingDoc && (
        <EditBaseModal 
          doc={editingDoc}
          onClose={() => setEditingDoc(null)} 
          onSave={(data) => editMutation.mutate({ id: editingDoc.id, ...data })}
          isPending={editMutation.isPending}
        />
      )}

      {previewUrl && (
        <PreviewModal 
          previewUrl={previewUrl} 
          downloadUrl={previewUrl.replace('/preview?', '/download?')}
          onClose={() => setPreviewUrl(null)} 
        />
      )}
    </div>
  )
}

function getPreviewSrc(url, mimeType) {
  const previewable = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'text/plain'];
  if (previewable.some(t => mimeType?.startsWith(t.split('/')[0]) || mimeType === t)) {
    return { type: 'inline', src: url };
  }
  // For Office docs, try Google Docs Viewer
  const officeMimes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (officeMimes.includes(mimeType)) {
    // Google Docs Viewer needs a public URL - since we're local, use download instead
    return { type: 'office', src: null };
  }
  return { type: 'unknown', src: null };
}

function PreviewModal({ previewUrl, downloadUrl, onClose }) {
  // Extract mimeType hint from URL or just try iframe
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full h-[90vh] max-w-5xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h3 className="font-bold text-gray-900">Vista Previa del Documento</h3>
          <div className="flex items-center gap-2">
            <a 
              href={downloadUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              <Download size={14} /> Descargar
            </a>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          <iframe 
            src={previewUrl} 
            className="w-full h-full border-none"
            title="Preview"
          />
          {/* Fallback message overlay - hidden when iframe loads successfully */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-0">
            <FileText className="text-gray-300 mb-3" size={64} />
            <p className="text-gray-500 font-medium">No se puede previsualizar este tipo de archivo</p>
            <p className="text-gray-400 text-sm mt-1">Usa el botón "Descargar" para abrirlo en tu ordenador</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditBaseModal({ doc, onClose, onSave, isPending }) {
  const [name, setName] = useState(doc.name)
  const [category, setCategory] = useState(doc.category)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Editar Documento Base</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, category }) }} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">NOMBRE DEL DOCUMENTO</label>
            <input 
              type="text" className="input h-11" 
              value={name} onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">CATEGORÍA</label>
            <select className="select h-11" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="GENERAL">General / Oficina</option>
              <option value="VENTA">Ventas</option>
              <option value="ALQUILER">Alquileres</option>
              <option value="LEGAL">Legal / LOPD</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" onClick={onClose} 
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UploadBaseModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [isPending, setIsPending] = useState(false)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Selecciona un archivo')
    
    setIsPending(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name || file.name)
    formData.append('category', category)

    try {
      await api.post('/base-documents', formData)
      toast.success('Documento subido correctamente')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Subir Documento Base</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleUpload} className="p-6 space-y-5">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              file ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input 
              type="file" id="file-upload" className="hidden" 
              onChange={e => {
                const f = e.target.files[0]
                setFile(f)
                if (f && !name) setName(f.name)
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="mx-auto w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3">
                <Upload size={20} className={file ? 'text-blue-600' : 'text-gray-400'} />
              </div>
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900 truncate max-w-[200px] mx-auto">{file.name}</p>
                  <p className="text-[10px] text-blue-600 uppercase">Archivo seleccionado</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">Haz clic para buscar</p>
                  <p className="text-xs text-gray-400">Cualquier tipo de archivo</p>
                </div>
              )}
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">NOMBRE DEL DOCUMENTO</label>
            <input 
              type="text" className="input h-11" placeholder="Ej: Contrato de Arras Tipo"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">CATEGORÍA</label>
            <select className="select h-11" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="GENERAL">General / Oficina</option>
              <option value="VENTA">Ventas</option>
              <option value="ALQUILER">Alquileres</option>
              <option value="LEGAL">Legal / LOPD</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" onClick={onClose} 
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
            >
              {isPending ? 'Subiendo...' : 'Confirmar subida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
