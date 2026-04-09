import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import api from '../api/client'

export default function NewExpedientPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Cliente, 2: Inmueble/Operación, 3: Responsables
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/expedients', data),
    onSuccess: (res) => {
      toast.success(`Expediente ${res.data.code} creado`)
      navigate(`/expedients/${res.data.id}`)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al crear expediente'),
  })

  const onSubmit = (data) => {
    const payload = {
      clientId: data.clientId,
      operationType: data.operationType,
      operationSize: data.operationSize || 'INDIVIDUAL',
      propertyAddress: data.propertyAddress,
      propertyCity: data.propertyCity,
      propertyPrice: data.propertyPrice ? parseFloat(data.propertyPrice) : null,
      propertyM2: data.propertyM2 ? parseFloat(data.propertyM2) : null,
      propertyRooms: data.propertyRooms ? parseInt(data.propertyRooms) : null,
      propertyBaths: data.propertyBaths ? parseInt(data.propertyBaths) : null,
      notes: data.notes,
      assignments: [
        ...(data.firmasId ? [{ userId: data.firmasId, role: 'FIRMAS' }] : []),
        ...(data.marketingId ? [{ userId: data.marketingId, role: 'MARKETING' }] : []),
      ],
    }
    createMutation.mutate(payload)
  }

  const operationType = watch('operationType')
  const firmasUsers = users?.filter(u => u.role === 'FIRMAS') || []
  const marketingUsers = users?.filter(u => u.role === 'MARKETING') || []
  const comercialClients = clients?.data || []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/expedients')} className="btn-secondary px-2">
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Nuevo expediente</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Sección 1: Cliente */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">1. Cliente</h3>

          <div>
            <label className="label">Cliente existente</label>
            <select className="select" {...register('clientId', { required: 'El cliente es obligatorio' })}>
              <option value="">Selecciona un cliente...</option>
              {comercialClients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName ? `${c.firstName} ${c.lastName || ''}` : c.companyName} ({c.type})
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId.message}</p>}
            <p className="text-xs text-gray-400 mt-1">
              ¿Cliente nuevo? <a href="/clients" className="text-blue-600">Créalo primero en Clientes</a>
            </p>
          </div>
        </div>

        {/* Sección 2: Operación */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">2. Operación e inmueble</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de operación *</label>
              <select className="select" {...register('operationType', { required: true })}>
                <option value="">Selecciona...</option>
                {['VENTA', 'ALQUILER', 'COMPRA', 'INVERSION', 'PROMOCION', 'EDIFICIO', 'RESORT'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tamaño de operación</label>
              <select className="select" {...register('operationSize')}>
                <option value="INDIVIDUAL">Individual (estándar)</option>
                <option value="PREMIUM">Premium</option>
                <option value="GRANDE">Grande / Institucional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Dirección del inmueble</label>
            <input type="text" className="input" placeholder="Calle Mayor 1, Piso 2A"
              {...register('propertyAddress')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ciudad</label>
              <input type="text" className="input" {...register('propertyCity')} />
            </div>
            <div>
              <label className="label">Precio (€)</label>
              <input type="number" className="input" placeholder="280000" {...register('propertyPrice')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Superficie (m²)</label>
              <input type="number" className="input" placeholder="85" {...register('propertyM2')} />
            </div>
            <div>
              <label className="label">Habitaciones</label>
              <input type="number" className="input" placeholder="3" {...register('propertyRooms')} />
            </div>
            <div>
              <label className="label">Baños</label>
              <input type="number" className="input" placeholder="2" {...register('propertyBaths')} />
            </div>
          </div>
        </div>

        {/* Sección 3: Responsables */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">3. Responsables</h3>
          <p className="text-sm text-gray-500">
            Tú serás asignado automáticamente como comercial.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Responsable Firmas</label>
              <select className="select" {...register('firmasId')}>
                <option value="">Sin asignar</option>
                {firmasUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Responsable Marketing</label>
              <select className="select" {...register('marketingId')}>
                <option value="">Sin asignar</option>
                {marketingUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Notas adicionales</h3>
          <textarea className="input" rows={3} placeholder="Observaciones, contexto inicial..."
            {...register('notes')} />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/expedients')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            <Save size={15} />
            {createMutation.isPending ? 'Creando...' : 'Crear expediente'}
          </button>
        </div>
      </form>
    </div>
  )
}
