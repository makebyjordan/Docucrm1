import { useState } from 'react'
import { Calculator, TrendingDown, TrendingUp, ArrowRight, Info } from 'lucide-react'

const ITP_RATES = {
  'Andalucía': 7, 'Aragón': 8, 'Asturias': 8, 'Baleares': 8,
  'Canarias': 6.5, 'Cantabria': 8, 'Castilla-La Mancha': 9, 'Castilla y León': 8,
  'Cataluña': 10, 'Extremadura': 8, 'Galicia': 10, 'La Rioja': 7,
  'Madrid': 6, 'Murcia': 8, 'Navarra': 6, 'País Vasco': 4, 'Valencia': 10,
}

function fmt(v) { return Math.round(v).toLocaleString('es-ES') }
function Row({ label, value, color = '', bold = false, indent = false }) {
  return (
    <div className={`flex items-center justify-between text-sm py-1.5 border-b border-[var(--border-color)] last:border-0 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-[var(--text-muted)] ${bold ? 'font-bold text-[var(--text-main)]' : ''}`}>{label}</span>
      <span className={`font-medium ${bold ? 'text-base' : ''} ${color || 'text-[var(--text-main)]'}`}>{value}</span>
    </div>
  )
}

export default function CombinedFinancialCalculator({ exp }) {
  const [mode, setMode] = useState('vende_para_comprar') // vende_para_comprar | compra_directa

  // VENTA del inmueble actual
  const [ventaPrecio, setVentaPrecio] = useState(exp?.propertyPrice ? Number(exp.propertyPrice) : 0)
  const [ventaHipotecaPendiente, setVentaHipotecaPendiente] = useState(0)
  const [ventaComision, setVentaComision] = useState(3)
  const [ventaGastosExtra, setVentaGastosExtra] = useState(0)

  // COMPRA del nuevo inmueble
  const [compraPrecio, setCompraPrecio] = useState(0)
  const [comunidad, setComunidad] = useState('Madrid')
  const [esNuevaObra, setEsNuevaObra] = useState(false)
  const [hipotecaNueva, setHipotecaNueva] = useState(0)

  // ── Cálculos venta ────────────────────────────────────────────────────────
  const comisionVenta = Math.round(ventaPrecio * (ventaComision / 100))
  const plusvalia = Math.round(ventaPrecio * 0.015) // estimado
  const netoDespuesDeVenta = ventaPrecio - ventaHipotecaPendiente - comisionVenta - plusvalia - ventaGastosExtra

  // ── Cálculos compra ───────────────────────────────────────────────────────
  const notaryCalc = Math.round(Math.min(Math.max(compraPrecio * 0.003, 600), 2500))
  const registryCalc = Math.round(Math.min(Math.max(compraPrecio * 0.001, 300), 1200))
  const gestoriaCalc = 450
  const itpRate = esNuevaObra ? 10 : (ITP_RATES[comunidad] || 7)
  const taxCalc = Math.round(compraPrecio * (itpRate / 100))
  const ajdCalc = esNuevaObra ? Math.round(compraPrecio * 0.015) : 0
  const tasacionCalc = hipotecaNueva > 0 ? Math.round(Math.min(Math.max(compraPrecio * 0.0005, 350), 800)) : 0
  const totalGastosCompra = notaryCalc + registryCalc + gestoriaCalc + taxCalc + ajdCalc + tasacionCalc

  const financiacion = hipotecaNueva > 0 ? Math.min(hipotecaNueva, compraPrecio * 0.8) : 0
  const totalNecesarioCompra = compraPrecio + totalGastosCompra - financiacion

  // ── Balance neto ──────────────────────────────────────────────────────────
  const balance = mode === 'vende_para_comprar'
    ? netoDespuesDeVenta - totalNecesarioCompra
    : 0 // modo compra directa no usa venta

  return (
    <div className="space-y-4">
      {/* Selector modo */}
      <div className="card p-5">
        <h3 className="font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
          <Calculator size={16} className="text-[var(--primary-color)]" />
          Calculadora financiera combinada
        </h3>
        <div className="flex gap-2">
          {[
            { key: 'vende_para_comprar', label: 'Vende para comprar' },
            { key: 'compra_directa', label: 'Compra directa' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setMode(key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === key
                  ? 'bg-[var(--primary-color)] text-white'
                  : 'bg-[var(--sidebar-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel venta */}
        {mode === 'vende_para_comprar' && (
          <div className="card p-5">
            <h4 className="font-semibold text-sm text-[var(--text-main)] mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-green-400" /> Ingresos por venta
            </h4>
            <div className="space-y-3">
              <div>
                <label className="label text-xs">Precio de venta (€)</label>
                <input type="number" className="input" value={ventaPrecio || ''}
                  onChange={e => setVentaPrecio(Number(e.target.value) || 0)} placeholder="Ej: 300000" />
              </div>
              <div>
                <label className="label text-xs">Hipoteca pendiente (€)</label>
                <input type="number" className="input" value={ventaHipotecaPendiente || ''}
                  onChange={e => setVentaHipotecaPendiente(Number(e.target.value) || 0)} placeholder="0 si libre de cargas" />
              </div>
              <div>
                <label className="label text-xs">Comisión agencia (%)</label>
                <input type="number" className="input" value={ventaComision || ''}
                  onChange={e => setVentaComision(Number(e.target.value) || 0)} step="0.5" />
              </div>
              <div>
                <label className="label text-xs">Otros gastos venta (€)</label>
                <input type="number" className="input" value={ventaGastosExtra || ''}
                  onChange={e => setVentaGastosExtra(Number(e.target.value) || 0)} placeholder="Cédula, IBI, etc." />
              </div>
            </div>
            {ventaPrecio > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-[var(--sidebar-bg)] space-y-1.5">
                <Row label="Precio venta" value={`${fmt(ventaPrecio)} €`} />
                <Row label="— Hipoteca pendiente" value={`- ${fmt(ventaHipotecaPendiente)} €`} color="text-red-400" indent />
                <Row label={`— Comisión agencia (${ventaComision}%)`} value={`- ${fmt(comisionVenta)} €`} color="text-red-400" indent />
                <Row label="— Plusvalía municipal (est.)" value={`- ${fmt(plusvalia)} €`} color="text-red-400" indent />
                {ventaGastosExtra > 0 && <Row label="— Otros gastos" value={`- ${fmt(ventaGastosExtra)} €`} color="text-red-400" indent />}
                <Row label="Neto disponible" value={`${fmt(netoDespuesDeVenta)} €`}
                  color={netoDespuesDeVenta >= 0 ? 'text-green-400' : 'text-red-400'} bold />
              </div>
            )}
          </div>
        )}

        {/* Panel compra */}
        <div className="card p-5">
          <h4 className="font-semibold text-sm text-[var(--text-main)] mb-3 flex items-center gap-2">
            <TrendingDown size={14} className="text-blue-400" /> Coste de la compra
          </h4>
          <div className="space-y-3">
            <div>
              <label className="label text-xs">Precio de compra (€)</label>
              <input type="number" className="input" value={compraPrecio || ''}
                onChange={e => setCompraPrecio(Number(e.target.value) || 0)} placeholder="Ej: 350000" />
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
              <label className="label text-xs">Hipoteca para la compra (€)</label>
              <input type="number" className="input" value={hipotecaNueva || ''}
                onChange={e => setHipotecaNueva(Number(e.target.value) || 0)} placeholder="0 si es al contado" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={esNuevaObra} onChange={e => setEsNuevaObra(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-[var(--text-muted)]">Obra nueva (IVA + AJD)</span>
            </label>
          </div>
          {compraPrecio > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--sidebar-bg)] space-y-1.5">
              <Row label="Precio compra" value={`${fmt(compraPrecio)} €`} />
              <Row label={esNuevaObra ? 'IVA (10%)' : `ITP (${itpRate}%)`} value={`${fmt(taxCalc)} €`} color="text-red-400" indent />
              {ajdCalc > 0 && <Row label="AJD (1.5%)" value={`${fmt(ajdCalc)} €`} color="text-red-400" indent />}
              <Row label="Notaría" value={`${fmt(notaryCalc)} €`} color="text-red-400" indent />
              <Row label="Registro" value={`${fmt(registryCalc)} €`} color="text-red-400" indent />
              <Row label="Gestoría" value={`${fmt(gestoriaCalc)} €`} color="text-red-400" indent />
              {tasacionCalc > 0 && <Row label="Tasación" value={`${fmt(tasacionCalc)} €`} color="text-red-400" indent />}
              <Row label="Total gastos" value={`${fmt(totalGastosCompra)} €`} color="text-yellow-400" bold />
              {financiacion > 0 && <Row label="— Financiación banco" value={`- ${fmt(financiacion)} €`} color="text-green-400" indent />}
              <Row label="Aportación necesaria" value={`${fmt(totalNecesarioCompra)} €`} color="text-blue-400" bold />
            </div>
          )}
        </div>
      </div>

      {/* Balance neto */}
      {mode === 'vende_para_comprar' && ventaPrecio > 0 && compraPrecio > 0 && (
        <div className={`card p-5 border-2 ${balance >= 0 ? 'border-green-500/40' : 'border-red-500/40'}`}>
          <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-[var(--text-main)]">
            <ArrowRight size={14} className={balance >= 0 ? 'text-green-400' : 'text-red-400'} />
            Balance neto de la operación combinada
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-green-400/10">
              <p className="text-xs text-green-400 mb-1">Neto venta</p>
              <p className="text-lg font-bold text-green-400">{fmt(netoDespuesDeVenta)} €</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-400/10">
              <p className="text-xs text-blue-400 mb-1">Aportación compra</p>
              <p className="text-lg font-bold text-blue-400">{fmt(totalNecesarioCompra)} €</p>
            </div>
            <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
              <p className={`text-xs mb-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {balance >= 0 ? 'Sobrante' : 'Falta'}
              </p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {balance >= 0 ? '+' : ''}{fmt(balance)} €
              </p>
            </div>
          </div>
          {balance < 0 && (
            <p className="text-xs text-red-400 mt-3 flex items-start gap-1.5">
              <Info size={11} className="mt-0.5 shrink-0" />
              El cliente necesita {fmt(Math.abs(balance))} € adicionales para completar la operación sin hipoteca,
              o ampliar la financiación bancaria.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
