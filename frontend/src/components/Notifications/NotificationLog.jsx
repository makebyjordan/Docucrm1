import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { CheckCircle, XCircle, Clock, RotateCcw, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const STATUS_CONFIG = {
  ENVIADO:  { icon: CheckCircle, color: 'text-green-500', label: 'Enviado' },
  FALLIDO:  { icon: XCircle, color: 'text-red-500', label: 'Fallido' },
  PENDIENTE:{ icon: Clock, color: 'text-yellow-500', label: 'Pendiente' },
}

const TYPE_LABELS = {
  APERTURA_EXPEDIENTE: 'Apertura expediente',
  FASE_COMPLETADA: 'Cambio de fase',
  BLOQUEO_DETECTADO: 'Bloqueo detectado',
  TAREA_COMPLETADA: 'Tarea completada',
  AVISO_PROPIETARIO: 'Aviso propietario',
  AVISO_COMERCIAL: 'Aviso comercial',
  RENOVAR_EXCLUSIVIDAD: 'Renovar exclusividad',
  OPERACION_CERRADA: 'Operación cerrada',
  POSVENTA_3_MESES: 'Posventa 3 meses',
  POSVENTA_6_MESES: 'Posventa 6 meses',
  POSVENTA_12_MESES: 'Posventa 12 meses',
}

export default function NotificationLog({ expedientId }) {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', expedientId],
    queryFn: () => api.get(`/notifications/expedient/${expedientId}`).then(r => r.data),
  })

  const resendMutation = useMutation({
    mutationFn: (notifId) => api.post(`/notifications/send/${notifId}`),
    onSuccess: () => toast.success('Notificación reenviada'),
    onError: () => toast.error('Error al reenviar'),
  })

  if (isLoading) return <div className="text-gray-400 text-center py-10">Cargando notificaciones...</div>

  if (!notifications?.length) {
    return (
      <div className="card p-8 text-center">
        <Bell size={32} className="text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400">Sin notificaciones enviadas para este expediente</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-gray-100">
        {notifications.map(notif => {
          const cfg = STATUS_CONFIG[notif.status] || STATUS_CONFIG.PENDIENTE
          const Icon = cfg.icon

          return (
            <div key={notif.id} className="flex items-start gap-3 px-5 py-3">
              <Icon size={16} className={`mt-0.5 shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{notif.subject}</span>
                  <span className="badge bg-gray-100 text-gray-600 text-xs">
                    {TYPE_LABELS[notif.type] || notif.type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Para: {notif.toEmail}
                  {notif.sentAt && ` · ${format(new Date(notif.sentAt), 'dd/MM/yyyy HH:mm', { locale: es })}`}
                </p>
                {notif.errorMessage && (
                  <p className="text-xs text-red-500 mt-0.5">Error: {notif.errorMessage}</p>
                )}
              </div>
              {notif.status === 'FALLIDO' && (
                <button
                  onClick={() => resendMutation.mutate(notif.id)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                  title="Reenviar"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
