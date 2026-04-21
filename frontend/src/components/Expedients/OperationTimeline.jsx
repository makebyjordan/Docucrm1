import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Circle, Clock, AlertTriangle, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

const ALL_PHASE_LABELS = {
  CAPTACION: 'Captación', VALORACION: 'Valoración', FORMULARIO: 'Formulario', DOCUMENTACION: 'Documentación',
  VALIDACION: 'Validación', ACUERDO: 'Acuerdo/Exclusiva', MARKETING_FORMULARIO: 'Brief Marketing',
  MARKETING_EJECUCION: 'Producción Mkt', VISITAS: 'Visitas', PREVENTA: 'Preventa',
  BUSQUEDA_ACTIVA: 'Búsqueda activa', NEGOCIACION: 'Negociación', ACUERDO_INTERESADO: 'Propuesta/Señal',
  ARRAS: 'Arras', HIPOTECA: 'Hipoteca', NOTARIA: 'Notaría', CIERRE: 'Cierre', POSVENTA: 'Posventa',
  CERRADO: 'Finalizado', CANCELADO: 'Cancelado',
  CAPTACION_INMUEBLE: 'Captación inmueble', VALORACION_MERCADO: 'Valoración mercado',
  MANDATO_EXCLUSIVA: 'Mandato/Exclusiva', DOCUMENTACION_LEGAL: 'Doc. legal',
  PREPARACION_MARKETING: 'Prep. marketing', PUBLICACION_ACTIVO: 'Publicación',
  CAPTACION_COMPRADOR: 'Captación comprador', GESTION_VISITAS: 'Gestión visitas',
  NEGOCIACION_PRECIO: 'Negociación precio', RESERVA_SENAL: 'Reserva/Señal',
  ARRAS_PRIVADO: 'Arras', GESTION_HIPOTECA: 'Hipoteca',
  PREPARACION_NOTARIA: 'Prep. notaría', FIRMA_ESCRITURA: 'Firma escritura',
  CIERRE_REGISTRO: 'Cierre/Registro', POSTVENTA_SEGUIMIENTO: 'Postventa',
  CAPTACION_PROPIEDAD: 'Captación propiedad', VALORACION_RENTA: 'Valoración renta',
  MANDATO_ALQUILER: 'Mandato alquiler', DOCUMENTACION_INMUEBLE: 'Doc. inmueble',
  MARKETING_DIFUSION: 'Marketing/Difusión', GESTION_VISITAS_ALQ: 'Visitas',
  CAPTACION_INQUILINO: 'Captación inquilino', PRESENTACION_INMUEBLES: 'Presentación',
  DOCUMENTACION_SOLVENCIA: 'Doc. solvencia', VALIDACION_ECONOMICA: 'Validación económica',
  NEGOCIACION_CONDICIONES: 'Negociación', CONTRATO_ALQUILER: 'Contrato alquiler',
  ENTREGA_INMUEBLE: 'Entrega inmueble', GESTION_MENSUAL: 'Gestión mensual',
}

function getLabel(phase) {
  return ALL_PHASE_LABELS[phase] || phase
}

function getDuration(enteredAt, exitedAt) {
  const end = exitedAt ? new Date(exitedAt) : new Date()
  const days = Math.ceil((end - new Date(enteredAt)) / (1000 * 60 * 60 * 24))
  if (days < 1) return '< 1 día'
  if (days === 1) return '1 día'
  return `${days} días`
}

function buildPhases(phaseHistory, currentPhase, openedAt) {
  const history = [...(phaseHistory || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const phases = []
  const seen = new Set()

  if (history.length > 0) {
    const first = history[0]
    if (!seen.has(first.toPhase)) {
      phases.push({ phase: first.toPhase, enteredAt: first.createdAt, exitedAt: null, notes: first.notes, user: first.changedBy })
      seen.add(first.toPhase)
    }
  }
  for (let i = 1; i < history.length; i++) {
    const entry = history[i]
    const prev = phases.find(p => p.phase === entry.fromPhase && !p.exitedAt)
    if (prev) prev.exitedAt = entry.createdAt
    if (!seen.has(entry.toPhase)) {
      phases.push({ phase: entry.toPhase, enteredAt: entry.createdAt, exitedAt: null, notes: entry.notes, user: entry.changedBy })
      seen.add(entry.toPhase)
    }
  }
  const currentEntry = phases.find(p => p.phase === currentPhase)
  if (!currentEntry && currentPhase) {
    phases.push({ phase: currentPhase, enteredAt: openedAt, exitedAt: null })
  }
  return phases
}

// ─── Gantt bar for a single expedient ────────────────────────────────────────
function GanttRow({ exp, allStart, totalMs, isCurrent, linkType, isBlocking }) {
  const start = new Date(exp.openedAt).getTime()
  const end = exp.closedAt ? new Date(exp.closedAt).getTime() : Date.now()
  const leftPct = ((start - allStart) / totalMs) * 100
  const widthPct = Math.max(((end - start) / totalMs) * 100, 2)

  const clientName = exp.client?.firstName
    ? `${exp.client.firstName} ${exp.client.lastName || ''}`.trim()
    : exp.client?.companyName || ''

  const barColor =
    exp.status === 'CANCELADO' ? 'bg-gray-500' :
    exp.status === 'BLOQUEADO' ? 'bg-red-500' :
    exp.status === 'COMPLETADO' ? 'bg-blue-500' :
    isCurrent ? 'bg-[var(--primary-color)]' : 'bg-green-500'

  return (
    <div className="flex items-center gap-2 mb-2 group">
      {/* Label */}
      <div className="w-36 shrink-0 text-right pr-2">
        <Link to={`/expedients/${exp.id}`} className="text-[10px] font-mono font-bold text-[var(--primary-color)] hover:underline block truncate">
          {exp.code}
        </Link>
        <p className="text-[9px] text-[var(--text-muted)] truncate">{clientName || exp.operationType}</p>
        {linkType && (
          <span className={`text-[8px] font-bold ${isBlocking ? 'text-red-400' : 'text-gray-400'}`}>
            {isBlocking ? '⛔ ' : '🔗 '}{linkType.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="flex-1 relative h-7">
        <div
          className={`absolute top-1 h-5 rounded-md ${barColor} opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-2 overflow-hidden`}
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '4px' }}
        >
          <span className="text-[9px] font-medium text-white truncate">
            {getLabel(exp.currentPhase)}
          </span>
        </div>
      </div>

      {/* Duration */}
      <div className="w-14 shrink-0 text-[9px] text-[var(--text-muted)] text-right">
        {getDuration(exp.openedAt, exp.closedAt)}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OperationTimeline({ exp }) {
  const expedientId = exp?.id

  const { data: linksData } = useQuery({
    queryKey: ['links', expedientId],
    queryFn: () => api.get(`/expedients/${expedientId}/links`).then(r => r.data),
    enabled: !!expedientId,
    staleTime: 30000,
  })

  if (!exp) return null

  const phases = buildPhases(exp.phaseHistory, exp.currentPhase, exp.openedAt)

  const isCurrent = (phase) => phase === exp.currentPhase && !['CERRADO', 'CANCELADO'].includes(exp.status)
  const isCompleted = (p) => p.exitedAt !== null || ['CERRADO', 'CANCELADO'].includes(p.phase)

  // ── Gantt data ─────────────────────────────────────────────────────────────
  const linkedExps = [
    ...(linksData?.outgoing || []).map(l => ({ exp: l.linkedExpedient, linkType: l.linkType, isBlocking: l.isBlocking })),
    ...(linksData?.incoming || []).map(l => ({ exp: l.expedient, linkType: l.linkType, isBlocking: false })),
  ]

  const allExps = [
    { exp, linkType: null, isBlocking: false, isCurrent: true },
    ...linkedExps.map(l => ({ ...l, isCurrent: false })),
  ]

  const allDates = allExps.flatMap(({ exp: e }) => [
    new Date(e?.openedAt || exp.openedAt).getTime(),
    e?.closedAt ? new Date(e.closedAt).getTime() : Date.now(),
  ]).filter(Boolean)

  const allStart = Math.min(...allDates)
  const allEnd = Math.max(...allDates)
  const totalMs = Math.max(allEnd - allStart, 1000 * 60 * 60 * 24)

  const showGantt = linkedExps.length > 0

  if (phases.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Clock size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-400 text-sm">Sin historial de fases</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Gantt sincronizado (solo si hay vinculados) */}
      {showGantt && (
        <div className="card p-5">
          <h3 className="font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">
            <Link2 size={15} className="text-[var(--primary-color)]" />
            Vista sincronizada — expedientes vinculados
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Línea de tiempo comparativa entre este expediente y los vinculados
          </p>

          {/* Eje de tiempo */}
          <div className="flex items-center gap-2 mb-1 pl-[152px] pr-[60px]">
            <div className="flex-1 flex justify-between text-[9px] text-[var(--text-muted)]">
              <span>{new Date(allStart).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}</span>
              <span>Hoy</span>
            </div>
          </div>
          <div className="pl-[152px] pr-[60px] mb-3">
            <div className="h-px bg-[var(--border-color)] relative">
              {[0, 25, 50, 75, 100].map(pct => (
                <div key={pct} className="absolute top-0 w-px h-2 bg-[var(--border-color)]" style={{ left: `${pct}%` }} />
              ))}
            </div>
          </div>

          {allExps.filter(({ exp: e }) => !!e).map(({ exp: e, linkType, isBlocking, isCurrent: ic }) => (
            <GanttRow
              key={e.id}
              exp={e}
              allStart={allStart}
              totalMs={totalMs}
              isCurrent={ic}
              linkType={linkType}
              isBlocking={isBlocking}
            />
          ))}

          <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex flex-wrap gap-3">
            {[
              { color: 'bg-[var(--primary-color)]', label: 'Este expediente' },
              { color: 'bg-green-500', label: 'Activo' },
              { color: 'bg-blue-500', label: 'Completado' },
              { color: 'bg-red-500', label: 'Bloqueado' },
              { color: 'bg-gray-500', label: 'Cancelado' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-2 rounded ${color}`} />
                <span className="text-[9px] text-[var(--text-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline vertical del expediente actual */}
      <div className="card p-5">
        <h3 className="font-bold text-[var(--text-main)] mb-2">Timeline de la operación</h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">
          Abierto el {new Date(exp.openedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
          {exp.closedAt && ` · Cerrado el ${new Date(exp.closedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        </p>

        <ol className="relative">
          {phases.map((p, idx) => {
            const current = isCurrent(p.phase)
            const completed = isCompleted(p)
            const blocked = p.phase === 'BLOQUEADO'

            return (
              <li key={`${p.phase}-${idx}`} className="relative pl-8 pb-6 last:pb-0">
                {idx < phases.length - 1 && (
                  <div className={`absolute left-[11px] top-5 bottom-0 w-0.5 ${completed ? 'bg-[var(--primary-color)]/40' : 'bg-[var(--border-color)]'}`} />
                )}
                <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                  blocked   ? 'border-red-500 bg-red-500/20' :
                  current   ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/20 animate-pulse' :
                  completed ? 'border-[var(--primary-color)] bg-[var(--primary-color)]' :
                              'border-[var(--border-color)] bg-[var(--bg-color)]'
                }`}>
                  {blocked   ? <AlertTriangle size={10} className="text-red-500" /> :
                   completed ? <CheckCircle size={10} className="text-white" /> :
                   current   ? <Circle size={10} className="text-[var(--primary-color)]" /> :
                               <Circle size={10} className="text-[var(--text-muted)]" />}
                </div>

                <div className="ml-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${
                      current ? 'text-[var(--primary-color)]' :
                      completed ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'
                    }`}>
                      {getLabel(p.phase)}
                    </span>
                    {current && (
                      <span className="text-[10px] bg-[var(--primary-color)]/15 text-[var(--primary-color)] px-1.5 py-0.5 rounded font-bold">
                        ACTUAL
                      </span>
                    )}
                    {completed && p.exitedAt && (
                      <span className="text-[10px] text-green-400 font-medium">✓ Completada</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
                    <span>{new Date(p.enteredAt).toLocaleDateString('es-ES')}</span>
                    <span>·</span>
                    <span>{getDuration(p.enteredAt, p.exitedAt)}</span>
                    {p.user && <span>· {p.user.name}</span>}
                  </div>
                  {p.notes && (
                    <p className="text-xs text-[var(--text-muted)] italic mt-1 bg-[var(--bg-color)] px-2 py-1 rounded">
                      "{p.notes}"
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
