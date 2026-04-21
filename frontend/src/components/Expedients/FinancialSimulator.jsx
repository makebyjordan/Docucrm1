import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calculator, Save, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/client'

function InfoTooltip({ text }) {
  return (
    <span className="relative group inline-flex ml-1 cursor-help">
      <Info size={12} className="text-gray-400" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg z-50 leading-tight whitespace-normal text-center">
        {text}
      </span>
    </span>
  )
}

// ITP por comunidad autónoma (aproximado)
const ITP_RATES = {
  'Andalucía': 7, 'Aragón': 8, 'Asturias': 8, 'Baleares': 8,
  'Canarias': 6.5, 'Cantabria': 8, 'Castilla-La Mancha': 9, 'Castilla y León': 8,
  'Cataluña': 10, 'Extremadura': 8, 'Galicia': 10, 'La Rioja': 7,
  'Madrid': 6, 'Murcia': 8, 'Navarra': 6, 'País Vasco': 4, 'Valencia': 10,
}

export default function FinancialSimulator({ exp }) {
  const qc = useQueryClient()

  const [precio, setPrecio] = useState(exp?.propertyPrice ? Number(exp.propertyPrice) : 0)
  const [comunidad, setComunidad] = useState('Madrid')
  const [esNuevaObra, setEsNuevaObra] = useState(false)
  const [hipoteca, setHipoteca] = useState(0)
  const [showSaveFields, setShowSaveFields] = useState(false)
  const [gastos, setGastos] = useState({
    notaryFees: exp?.notaryFees ? Number(exp.notaryFees) : '',
    registryFees: exp?.registryFees ? Number(exp.registryFees) : '',
    taxesAmount: exp?.taxesAmount ? Number(exp.taxesAmount) : '',
  })

  const saveMutation = useMutation({
    mutationFn: (data) => api.put(`/expedients/${exp.id}`, data),
    onSuccess: () => {
      toast.success('Gastos guardados en el expediente')
      qc.invalidateQueries(['expedient', exp.id])
      setShowSaveFields(false)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al guardar'),
  })

  // ── Cálculos ─────────────────────────────────────────────────────────────────

  // Notaría: aprox. escala variable (0.1%-0.5% del precio)
  const notaryCalc = Math.round(Math.min(Math.max(precio * 0.003, 600), 2500))

  // Registro: aprox. 0.1-0.2% del precio
  const registryCalc = Math.round(Math.min(Math.max(precio * 0.001, 300), 1200))

  // Gestoría: fijo aprox. 300-600 €
  const gestoriaCalc = 450

  // Impuesto
  const itpRate = esNuevaObra ? 10 : (ITP_RATES[comunidad] || 7)
  const taxCalc = Math.round(precio * (itpRate / 100))

  // AJD (actos jurídicos documentados) para obra nueva: 1.5% aprox
  const ajdCalc = esNuevaObra ? Math.round(precio * 0.015) : 0

  // Tasación hipoteca (si aplica)
  const tasacionCalc = hipoteca > 0 ? Math.round(Math.min(Math.max(precio * 0.0005, 350), 800)) : 0

  // Total comprador
  const totalGastos = notaryCalc + registryCalc + gestoriaCalc + taxCalc + ajdCalc + tasacionCalc
  const totalConPrecio = precio + totalGastos
  const pctSobrePrecio = precio > 0 ? ((totalGastos / precio) * 100).toFixed(1) : 0

  // Aportación mínima sin hipoteca
  const financiacion = hipoteca > 0 ? Math.min(hipoteca, precio * 0.8) : 0
  const aportacion = precio + totalGastos - financiacion

  const fmt = (v) => v.toLocaleString('es-ES')

  return (
    <div className="space-y-4">
      {/* Configuración */}
      <div className="card p-5">
        <h3 className="font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
          <Calculator size={16} className="text-[var(--primary-color)]" />
          Simulador de costes para el comprador
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label text-xs">Precio de compra (€)</label>
            <input
              type="number" className="input"
              value={precio || ''}
              onChange={e => setPrecio(Number(e.target.value) || 0)}
              placeholder="Ej: 250000"
            />
          </div>
          <div>
            <label className="label text-xs">Comunidad Autónoma</label>
            <select className="select" value={comunidad} onChange={e => setComunidad(e.target.value)}>
              {Object.keys(ITP_RATES).sort().map(ca => (
                <option key={ca} value={ca}>{ca} — ITP {ITP_RATES[ca]}%</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Financiación hipotecaria (€)</label>
            <input
              type="number" className="input"
              value={hipoteca || ''}
              onChange={e => setHipoteca(Number(e.target.value) || 0)}
              placeholder="0 si es al contado"
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={esNuevaObra}
                onChange={e => setEsNuevaObra(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-[var(--text-muted)]">Obra nueva (IVA + AJD)</span>
            </label>
          </div>
        </div>

        {/* Desglose de gastos */}
        {precio > 0 && (
          <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
            <div className="bg-[var(--sidebar-bg)] px-4 py-2.5">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Desglose estimado de gastos</p>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'Notaría', value: notaryCalc, tooltip: 'Escala variable según precio. Incluye honorarios notariales.' },
                { label: 'Registro de la Propiedad', value: registryCalc, tooltip: 'Aranceles registrales, aprox. 0.1-0.15% del precio.' },
                { label: 'Gestoría', value: gestoriaCalc, tooltip: 'Gestión de impuestos, trámites registrales, etc.' },
                ...(esNuevaObra
                  ? [
                      { label: `IVA (10%)`, value: taxCalc, tooltip: 'IVA aplicable a viviendas de obra nueva.' },
                      { label: 'AJD (1.5% aprox.)', value: ajdCalc, tooltip: 'Actos Jurídicos Documentados para obra nueva.' },
                    ]
                  : [{ label: `ITP ${itpRate}% (${comunidad})`, value: taxCalc, tooltip: `Impuesto de Transmisiones Patrimoniales en ${comunidad}.` }]
                ),
                ...(tasacionCalc > 0 ? [{ label: 'Tasación bancaria', value: tasacionCalc, tooltip: 'Coste de la tasación requerida por el banco.' }] : []),
              ].map(({ label, value, tooltip }) => (
                <div key={label} className="flex items-center justify-between text-sm py-1 border-b border-[var(--border-color)] last:border-0">
                  <span className="text-[var(--text-muted)] flex items-center">
                    {label}
                    {tooltip && <InfoTooltip text={tooltip} />}
                  </span>
                  <span className="font-medium text-[var(--text-main)]">{fmt(value)} €</span>
                </div>
              ))}

              {/* Total gastos */}
              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t-2 border-[var(--border-color)]">
                <span className="text-[var(--text-main)]">Total gastos ({pctSobrePrecio}% s/precio)</span>
                <span className="text-yellow-500">{fmt(totalGastos)} €</span>
              </div>
            </div>

            {/* Resumen final */}
            <div className="bg-[var(--primary-color)]/10 border-t border-[var(--border-color)] p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Precio inmueble</span>
                <span className="font-medium">{fmt(precio)} €</span>
              </div>
              {hipoteca > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Financiación banco (máx. 80%)</span>
                  <span className="font-medium text-blue-400">- {fmt(Math.round(financiacion))} €</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1 border-t border-[var(--border-color)]">
                <span className="text-[var(--text-main)]">Aportación total del comprador</span>
                <span className="text-[var(--primary-color)] text-lg">{fmt(Math.round(aportacion))} €</span>
              </div>
              {hipoteca > 0 && (
                <p className="text-[10px] text-[var(--text-muted)]">
                  Incluye entrada ({fmt(Math.round(precio - financiacion))} €) + gastos ({fmt(totalGastos)} €)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Guardar gastos reales en el expediente */}
      {exp && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-[var(--text-main)]">Gastos reales del expediente</h4>
            <button
              onClick={() => setShowSaveFields(!showSaveFields)}
              className="text-xs text-[var(--primary-color)] hover:underline"
            >
              {showSaveFields ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {!showSaveFields ? (
            <dl className="space-y-2 text-sm">
              {[
                ['Gastos notaría', exp.notaryFees],
                ['Registro propiedad', exp.registryFees],
                ['Impuestos (ITP/AJD)', exp.taxesAmount],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">{label}</dt>
                  <dd className="font-medium">{val ? `${Number(val).toLocaleString('es-ES')} €` : '—'}</dd>
                </div>
              ))}
              {(exp.notaryFees || exp.registryFees || exp.taxesAmount) && (
                <div className="flex justify-between font-bold pt-2 border-t">
                  <dt className="text-[var(--text-main)]">Total</dt>
                  <dd className="text-[var(--primary-color)]">
                    {(Number(exp.notaryFees || 0) + Number(exp.registryFees || 0) + Number(exp.taxesAmount || 0)).toLocaleString('es-ES')} €
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="space-y-3">
              {[
                { key: 'notaryFees', label: 'Gastos notaría (€)', suggested: notaryCalc },
                { key: 'registryFees', label: 'Registro propiedad (€)', suggested: registryCalc },
                { key: 'taxesAmount', label: 'Impuestos ITP/AJD (€)', suggested: taxCalc },
              ].map(({ key, label, suggested }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label text-xs mb-0">{label}</label>
                    {suggested > 0 && (
                      <button
                        type="button"
                        onClick={() => setGastos(g => ({ ...g, [key]: suggested }))}
                        className="text-[10px] text-[var(--primary-color)] hover:underline"
                      >
                        Usar estimado ({fmt(suggested)} €)
                      </button>
                    )}
                  </div>
                  <input
                    type="number" className="input text-sm py-1.5"
                    value={gastos[key] || ''}
                    onChange={e => setGastos(g => ({ ...g, [key]: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => saveMutation.mutate({
                    notaryFees: gastos.notaryFees ? parseFloat(gastos.notaryFees) : null,
                    registryFees: gastos.registryFees ? parseFloat(gastos.registryFees) : null,
                    taxesAmount: gastos.taxesAmount ? parseFloat(gastos.taxesAmount) : null,
                  })}
                  disabled={saveMutation.isPending}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Save size={14} />
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar gastos'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
