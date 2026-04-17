import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import api from '../api/client'

export default function ClientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | client object

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.get('/clients', { params: { search, limit: 50 } }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: () => { toast.success('Cliente eliminado'); qc.invalidateQueries(['clients']) },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })

  const clients = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" className="input pl-9" placeholder="Buscar cliente..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center text-gray-400 py-10">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre / Empresa', 'Tipo', 'Email', 'Teléfono', 'Expedientes', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">Sin clientes</td></tr>
              )}
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.firstName ? `${c.firstName} ${c.lastName || ''}`.trim() : c.companyName}
                    {c.dni && <span className="text-xs text-gray-400 ml-2">({c.dni})</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-blue-50 text-blue-700">{c.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-gray-100 text-gray-700">{c._count?.expedients || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(c)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar cliente?')) deleteMutation.mutate(c.id) }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ClientModal
          client={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { qc.invalidateQueries(['clients']); setModal(null) }}
        />
      )}
    </div>
  )
}

function ClientModal({ client, onClose, onSaved }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: client || {},
  })

  const mutation = useMutation({
    mutationFn: (data) => client
      ? api.put(`/clients/${client.id}`, data)
      : api.post('/clients', data),
    onSuccess: () => { toast.success(client ? 'Cliente actualizado' : 'Cliente creado'); onSaved() },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">{client ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo *</label>
              <select className="select" {...register('type', { required: true })}>
                {['INQUILINO', 'PROPIETARIO', 'COMPRADOR', 'VENDEDOR', 'INVERSOR', 'EMPRESA'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input type="text" className="input" {...register('firstName')} />
            </div>
            <div>
              <label className="label">Apellidos</label>
              <input type="text" className="input" {...register('lastName')} />
            </div>
          </div>

          <div>
            <label className="label">Empresa (si aplica)</label>
            <input type="text" className="input" {...register('companyName')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">DNI/NIE</label>
              <input type="text" className="input" {...register('dni')} />
            </div>
            <div>
              <label className="label">NIF (empresa)</label>
              <input type="text" className="input" {...register('nif')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" {...register('email', { required: true })} />
            </div>
            <div>
              <label className="label">Teléfono *</label>
              <input type="tel" className="input" {...register('phone', { required: true })} />
            </div>
          </div>

          <div>
            <label className="label">Dirección</label>
            <input type="text" className="input" {...register('address')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ciudad</label>
              <input type="text" className="input" {...register('city')} />
            </div>
            <div>
              <label className="label">Código postal</label>
              <input type="text" className="input" {...register('postalCode')} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="privacy" {...register('privacyPolicy')} />
            <label htmlFor="privacy" className="text-sm text-gray-700">Política de privacidad aceptada</label>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea rows={3} className="input resize-none" placeholder="Observaciones sobre el cliente..."
              {...register('notes')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
