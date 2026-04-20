import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar as CalIcon,
  Clock, User, FileText, Trash2, Pencil, List,
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay,
  isToday, parseISO, addDays, isPast, isThisWeek, compareAsc,
} from 'date-fns'
import { es } from 'date-fns/locale'
import api from '../api/client'
import toast from 'react-hot-toast'

const EVENT_TYPES = [
  { value: 'VISITA',    label: 'Visita',        color: 'bg-blue-600' },
  { value: 'REUNION',   label: 'Reunión',        color: 'bg-indigo-600' },
  { value: 'LLAMADA',   label: 'Llamada',        color: 'bg-yellow-500' },
  { value: 'FIRMA',     label: 'Firma',          color: 'bg-purple-500' },
  { value: 'OTRO',      label: 'Otro',           color: 'bg-gray-400' },
]

function typeColor(type) {
  return EVENT_TYPES.find(t => t.value === type)?.color ?? 'bg-gray-400'
}
function typeLabel(type) {
  return EVENT_TYPES.find(t => t.value === type)?.label ?? type
}

function toLocalDatetimeValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─── Modal añadir / editar ────────────────────────────────────────────────────
function EventModal({ event, defaultDate, onClose, onSaved }) {
  const isEdit = Boolean(event)
  const [clients, setClients] = useState([])
  const [expedients, setExpedients] = useState([])
  const [form, setForm] = useState({
    title: event?.title ?? '',
    type: event?.type ?? 'REUNION',
    startAt: event?.startAt ? toLocalDatetimeValue(event.startAt) : (defaultDate ? `${defaultDate}T09:00` : ''),
    endAt: event?.endAt ? toLocalDatetimeValue(event.endAt) : '',
    allDay: event?.allDay ?? false,
    notes: event?.notes ?? '',
    clientId: event?.clientId ?? '',
    expedientId: event?.expedientId ?? '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/clients?limit=200').then(r => setClients(r.data.data ?? [])).catch(() => {})
    api.get('/expedients?limit=200').then(r => setExpedients(r.data.data ?? [])).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('El título es obligatorio')
    if (!form.startAt) return toast.error('La fecha de inicio es obligatoria')
    setSaving(true)
    try {
      const body = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        clientId: form.clientId || null,
        expedientId: form.expedientId || null,
      }
      if (isEdit) {
        const { data } = await api.put(`/calendar/${event.id}`, body)
        onSaved(data, 'edit')
      } else {
        const { data } = await api.post('/calendar', body)
        onSaved(data, 'create')
      }
      toast.success(isEdit ? 'Evento actualizado' : 'Evento creado')
      onClose()
    } catch {
      // axios interceptor ya muestra el toast de error
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{isEdit ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[var(--text-muted)]"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Título *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title} onChange={e => set('title', e.target.value)} placeholder="Descripción del evento" />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(t => (
                <button type="button" key={t.value}
                  onClick={() => set('type', t.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    form.type === t.value
                      ? `${t.color} text-white border-transparent`
                      : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--tertiary-color)]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Todo el día */}
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
            <input type="checkbox" checked={form.allDay} onChange={e => set('allDay', e.target.checked)}
              className="rounded" />
            Todo el día
          </label>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Inicio *</label>
              <input type={form.allDay ? 'date' : 'datetime-local'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.allDay ? form.startAt.slice(0, 10) : form.startAt}
                onChange={e => set('startAt', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Fin</label>
              <input type={form.allDay ? 'date' : 'datetime-local'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.allDay ? (form.endAt?.slice(0, 10) ?? '') : form.endAt}
                onChange={e => set('endAt', e.target.value)} />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Cliente (opcional)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.clientId} onChange={e => set('clientId', e.target.value)}>
              <option value="">— Sin cliente —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName || c.companyName} {c.lastName ?? ''}
                </option>
              ))}
            </select>
          </div>

          {/* Expediente */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Expediente (opcional)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.expedientId} onChange={e => set('expedientId', e.target.value)}>
              <option value="">— Sin expediente —</option>
              {expedients.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.code}</option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Notas</label>
            <textarea rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Detalles adicionales..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--text-muted)] border rounded-lg hover:bg-[var(--bg-color)]">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date())
  const [events, setEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('calendar') // 'calendar' | 'list'

  const fetchEvents = useCallback(async (month) => {
    setLoading(true)
    try {
      const from = format(startOfMonth(month), "yyyy-MM-dd'T'00:00:00")
      const to = format(endOfMonth(month), "yyyy-MM-dd'T'23:59:59")
      const { data } = await api.get(`/calendar?from=${from}&to=${to}`)
      setEvents(data)
    } catch {
      toast.error('Error cargando eventos')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllEvents = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/calendar')
      setAllEvents(data.sort((a, b) => compareAsc(parseISO(a.startAt), parseISO(b.startAt))))
    } catch {
      toast.error('Error cargando eventos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'calendar') fetchEvents(current)
    else fetchAllEvents()
  }, [view, current, fetchEvents, fetchAllEvents])

  useEffect(() => { fetchEvents(current) }, [current, fetchEvents])

  function handleSaved(event, mode) {
    const update = (prev) => mode === 'create'
      ? [...prev, event].sort((a, b) => compareAsc(parseISO(a.startAt), parseISO(b.startAt)))
      : prev.map(e => e.id === event.id ? event : e)
    setEvents(update)
    setAllEvents(update)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      await api.delete(`/calendar/${id}`)
      setEvents(prev => prev.filter(e => e.id !== id))
      setAllEvents(prev => prev.filter(e => e.id !== id))
      toast.success('Evento eliminado')
    } catch {}
  }

  // ─── Construir grid del mes ───────────────────────────────────────────────
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function eventsOnDay(day) {
    return events.filter(e => isSameDay(parseISO(e.startAt), day))
  }

  const selectedDayEvents = selected ? eventsOnDay(selected) : []
  const upcomingEvents = events
    .filter(e => new Date(e.startAt) >= new Date())
    .slice(0, 8)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-[var(--card-bg)]">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[var(--text-main)]">Calendario</h1>

          {/* Selector de vista */}
          <div className="flex items-center bg-[var(--sidebar-bg)] rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === 'calendar' ? 'bg-[var(--card-bg)] shadow text-blue-600' : 'text-gray-500 hover:text-[var(--text-muted)]'
              }`}>
              <CalIcon size={14} /> Calendario
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === 'list' ? 'bg-[var(--card-bg)] shadow text-blue-600' : 'text-gray-500 hover:text-[var(--text-muted)]'
              }`}>
              <List size={14} /> Lista
            </button>
          </div>

          {view === 'calendar' && (
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrent(subMonths(current, 1))}
                className="p-1.5 rounded-lg hover:bg-[var(--sidebar-bg)] text-[var(--text-muted)]">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-[var(--text-muted)] w-36 text-center capitalize">
                {format(current, 'MMMM yyyy', { locale: es })}
              </span>
              <button onClick={() => setCurrent(addMonths(current, 1))}
                className="p-1.5 rounded-lg hover:bg-[var(--sidebar-bg)] text-[var(--text-muted)]">
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setCurrent(new Date())}
                className="text-xs px-2 py-1 border rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-color)] ml-1">
                Hoy
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Añadir evento
        </button>
      </div>

      {/* ─── Vista Lista ────────────────────────────────────────────────────── */}
      {view === 'list' && <ListView events={allEvents} loading={loading}
        onEdit={ev => setModal({ mode: 'edit', event: ev })}
        onDelete={handleDelete} />}

      {/* ─── Vista Calendario ───────────────────────────────────────────────── */}
      {view === 'calendar' && <div className="flex flex-1 overflow-hidden">
        {/* ─── Calendario ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-4">
          {/* Cabecera días semana */}
          <div className="grid grid-cols-7 mb-1">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-xs font-semibold text-[var(--text-muted)] text-center py-2">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-[var(--border-color)] rounded-lg overflow-hidden border border-[var(--border-color)]">
            {days.map(day => {
              const dayEvents = eventsOnDay(day)
              const isCurrentMonth = isSameMonth(day, current)
              const isSelected = selected && isSameDay(day, selected)
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelected(isSameDay(day, selected) ? null : day)}
                  className={`bg-[var(--card-bg)] min-h-[90px] p-1.5 cursor-pointer transition-colors ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${isSelected ? 'ring-2 ring-inset ring-blue-500' : 'hover:bg-[var(--sidebar-bg)]/40'}`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday(day) ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)]'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id}
                        className={`text-white text-[10px] px-1 py-0.5 rounded truncate ${typeColor(ev.type)}`}
                        title={ev.title}>
                        {ev.allDay ? '' : format(parseISO(ev.startAt), 'HH:mm') + ' '}
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-[var(--text-muted)] pl-1">+{dayEvents.length - 3} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Panel lateral ────────────────────────────────────────────────── */}
        <div className="w-72 border-l bg-[var(--card-bg)] flex flex-col overflow-hidden shrink-0">
          {selected ? (
            <>
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--text-main)] capitalize">
                  {format(selected, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <button onClick={() => setModal({ mode: 'create', date: format(selected, 'yyyy-MM-dd') })}
                  className="text-blue-600 hover:text-blue-800">
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center mt-8">Sin eventos este día</p>
                ) : selectedDayEvents.map(ev => (
                  <EventCard key={ev.id} ev={ev}
                    onEdit={() => setModal({ mode: 'edit', event: ev })}
                    onDelete={() => handleDelete(ev.id)} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-[var(--text-main)]">Próximos eventos</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading && <p className="text-sm text-[var(--text-muted)] text-center mt-8">Cargando...</p>}
                {!loading && upcomingEvents.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)] text-center mt-8">No hay eventos próximos</p>
                )}
                {upcomingEvents.map(ev => (
                  <EventCard key={ev.id} ev={ev}
                    onEdit={() => setModal({ mode: 'edit', event: ev })}
                    onDelete={() => handleDelete(ev.id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>}

      {/* Modal */}
      {modal && (
        <EventModal
          event={modal.mode === 'edit' ? modal.event : null}
          defaultDate={modal.date ?? null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

function EventCard({ ev, onEdit, onDelete }) {
  return (
    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${typeColor(ev.type)}`} />
          <p className="text-sm font-medium text-[var(--text-main)] truncate">{ev.title}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="text-gray-400 hover:text-blue-600 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="mt-1.5 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Clock size={11} />
          {ev.allDay
            ? format(parseISO(ev.startAt), "d MMM yyyy", { locale: es })
            : format(parseISO(ev.startAt), "d MMM · HH:mm", { locale: es })}
          {ev.endAt && !ev.allDay && ` – ${format(parseISO(ev.endAt), 'HH:mm')}`}
        </div>
        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white ${typeColor(ev.type)}`}>
          {typeLabel(ev.type)}
        </span>
        {ev.client && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <User size={11} />
            {ev.client.firstName || ev.client.companyName} {ev.client.lastName ?? ''}
          </div>
        )}
        {ev.expedient && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <FileText size={11} />
            {ev.expedient.code}
          </div>
        )}
        {ev.notes && (
          <p className="text-xs text-[var(--text-muted)] truncate">{ev.notes}</p>
        )}
      </div>
    </div>
  )
}

// ─── Vista Lista ──────────────────────────────────────────────────────────────
function ListView({ events, loading, onEdit, onDelete }) {
  if (loading) return <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">Cargando...</div>
  if (events.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
      <CalIcon size={40} className="opacity-30" />
      <p className="text-sm">No hay eventos guardados</p>
    </div>
  )

  const groups = {}
  for (const ev of events) {
    const key = format(parseISO(ev.startAt), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const past = [], today = [], upcoming = []
  for (const entry of Object.entries(groups)) {
    const [key] = entry
    if (key < todayKey) past.push(entry)
    else if (key === todayKey) today.push(entry)
    else upcoming.push(entry)
  }

  function Section({ title, color, entries }) {
    if (entries.length === 0) return null
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{title}</h2>
          <span className="text-xs text-[var(--text-muted)]">({entries.reduce((s, [, e]) => s + e.length, 0)} eventos)</span>
        </div>
        <div className="space-y-5">
          {entries.map(([key, evs]) => (
            <div key={key}>
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-2 capitalize border-b pb-1.5">
                {format(parseISO(key), "EEEE, d 'de' MMMM yyyy", { locale: es })}
              </p>
              <div className="space-y-2 pl-2">
                {evs.map(ev => (
                  <div key={ev.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-[var(--card-bg)] hover:shadow-sm transition-shadow">
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${typeColor(ev.type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--text-main)]">{ev.title}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white ${typeColor(ev.type)}`}>
                          {typeLabel(ev.type)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Clock size={11} />
                          {ev.allDay ? 'Todo el día' : format(parseISO(ev.startAt), 'HH:mm')}
                          {ev.endAt && !ev.allDay && ` – ${format(parseISO(ev.endAt), 'HH:mm')}`}
                        </span>
                        {ev.client && (
                          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <User size={11} />
                            {ev.client.firstName || ev.client.companyName} {ev.client.lastName ?? ''}
                          </span>
                        )}
                        {ev.expedient && (
                          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <FileText size={11} />
                            {ev.expedient.code}
                          </span>
                        )}
                      </div>
                      {ev.notes && <p className="text-xs text-[var(--text-muted)] mt-1">{ev.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0 mt-0.5">
                      <button onClick={() => onEdit(ev)} className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDelete(ev.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 bg-[var(--bg-color)]">
      <Section title="Hoy" color="bg-blue-600" entries={today} />
      <Section title="Próximos" color="bg-indigo-600" entries={upcoming} />
      <Section title="Pasados" color="bg-gray-400" entries={[...past].reverse()} />
    </div>
  )
}
