import { useQuery } from '@tanstack/react-query'
import {
  FolderKanban, TrendingUp, Clock, AlertTriangle,
  FileText, CheckCircle, XCircle, BarChart3,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const PHASE_LABELS = {
  CAPTACION: 'Captación', FORMULARIO: 'Formulario', DOCUMENTACION: 'Documentación',
  VALIDACION: 'Validación', ACUERDO: 'Acuerdo', MARKETING_FORMULARIO: 'Brief Mkt',
  MARKETING_EJECUCION: 'Ejecución Mkt', PREVENTA: 'Preventa', BUSQUEDA_ACTIVA: 'Búsqueda',
  ACUERDO_INTERESADO: 'Ac. Interesado', CIERRE: 'Cierre', POSVENTA: 'Posventa',
}

const TYPE_COLORS = {
  VENTA: '#3b82f6', INQUILINO: '#10b981', COMPRA: '#f59e0b',
  PROPIETARIO: '#f97316', INVERSION_HOLDERS: '#8b5cf6',
}

const STATUS_COLORS = { ACTIVO: '#10b981', BLOQUEADO: '#ef4444', COMPLETADO: '#3b82f6' }

function StatCard({ icon: Icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => api.get('/dashboard/alerts').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: activity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => api.get('/dashboard/activity').then(r => r.data),
  })

  const phaseData = stats?.byPhase
    ? Object.entries(stats.byPhase).map(([phase, count]) => ({
        name: PHASE_LABELS[phase] || phase,
        expedientes: count,
      }))
    : []

  const typeData = stats?.byType
    ? Object.entries(stats.byType).map(([type, count]) => ({
        name: type, value: count, color: TYPE_COLORS[type] || '#6b7280',
      }))
    : []

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Expedientes activos" value={stats?.expedients.active ?? '—'} color="blue" />
        <StatCard icon={CheckCircle} label="Operaciones cerradas" value={stats?.expedients.closed ?? '—'} color="green" />
        <StatCard icon={XCircle} label="Bloqueados" value={stats?.expedients.blocked ?? '—'} color="red" />
        <StatCard icon={TrendingUp} label="Tasa de cierre" value={stats ? `${stats.closureRate}%` : '—'} color="yellow"
          sub={`Media ${stats?.avgDaysToClose ?? '—'} días`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Documentos pendientes" value={stats?.pendingDocs ?? '—'} color="yellow" />
        <StatCard icon={Clock} label="Firmas pendientes" value={stats?.pendingSignatures ?? '—'} color="yellow" />
        <StatCard icon={AlertTriangle} label="Expedientes bloqueados" value={alerts?.blocked?.length ?? '—'} color="red" />
        <StatCard icon={BarChart3} label="Sin actividad 7 días" value={alerts?.stale?.length ?? '—'} color="red" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por fase */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Expedientes por fase</h3>
          {phaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={phaseData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="expedientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Sin datos</p>
          )}
        </div>

        {/* Por tipo */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Expedientes por tipo</h3>
          {typeData.length > 0 ? (
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie data={typeData} cx={75} cy={75} outerRadius={65} dataKey="value">
                  {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
              <div className="space-y-2">
                {typeData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-bold text-gray-900 ml-auto pl-4">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Sin datos</p>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alerts?.blocked?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            Expedientes bloqueados
          </h3>
          <div className="space-y-2">
            {alerts.blocked.map(exp => (
              <div key={exp.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg">
                <div>
                  <span className="font-mono text-sm font-bold text-gray-800">{exp.code}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {exp.client?.firstName || exp.client?.companyName}
                  </span>
                </div>
                <span className="text-xs text-red-600">
                  {formatDistanceToNow(new Date(exp.updatedAt), { addSuffix: true, locale: es })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actividad reciente */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Actividad reciente</h3>
        {activity?.recentPhaseChanges?.length > 0 ? (
          <div className="space-y-2">
            {activity.recentPhaseChanges.map(change => (
              <div key={change.id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="font-mono text-gray-600 text-xs">{change.expedient?.code}</span>
                <span className="text-gray-500 flex-1">
                  {PHASE_LABELS[change.fromPhase] || change.fromPhase} → <strong>{PHASE_LABELS[change.toPhase] || change.toPhase}</strong>
                </span>
                <span className="text-gray-400 text-xs">
                  {change.changedBy?.name || 'Sistema'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">Sin actividad reciente</p>
        )}
      </div>
    </div>
  )
}
