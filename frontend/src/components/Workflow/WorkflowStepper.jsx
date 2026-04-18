import { Check, AlertTriangle } from 'lucide-react'

const STEPS = [
  { id: 'CAPTACION', label: 'Captación' },
  { id: 'VALORACION', label: 'Valoración' },
  { id: 'FORMULARIO', label: 'Form.' },
  { id: 'DOCUMENTACION', label: 'Docs.' },
  { id: 'VALIDACION', label: 'Valid.' },
  { id: 'ACUERDO', label: 'Acuerdo' },
  { id: 'MARKETING_FORMULARIO', label: 'Brief' },
  { id: 'MARKETING_EJECUCION', label: 'Mkt' },
  { id: 'VISITAS', label: 'Visitas' },
  { id: 'PREVENTA', label: 'Preventa' },
  { id: 'BUSQUEDA_ACTIVA', label: 'Búsqueda' },
  { id: 'NEGOCIACION', label: 'Negoc.' },
  { id: 'ACUERDO_INTERESADO', label: 'Propue.' },
  { id: 'ARRAS', label: 'Arras' },
  { id: 'HIPOTECA', label: 'Hipot.' },
  { id: 'NOTARIA', label: 'Firma' },
  { id: 'CIERRE', label: 'Cierre' },
  { id: 'POSVENTA', label: 'P-Venta' },
]

export default function WorkflowStepper({ currentPhase, status, operationType }) {
  // Filtrar pasos según el tipo de operación
  const visibleSteps = STEPS.filter(step => {
    // Si es COMPRA, saltamos VALORACIÓN
    if (operationType === 'COMPRA' && step.id === 'VALORACION') return false;
    
    // Si no es INVERSION/GRANDE, podríamos saltar fases de marketing si fuera necesario, 
    // pero por ahora las dejamos todas visibles para que el usuario conozca el flujo completo.
    return true;
  });

  const currentIdx = visibleSteps.findIndex(s => s.id === currentPhase)

  return (
    <div className="card px-4 py-3 overflow-x-auto scrollbar-hide">
      <div className="flex items-center min-w-max gap-0">
        {visibleSteps.map((step, idx) => {
          const done = idx < currentIdx
          const active = idx === currentIdx
          const blocked = active && status === 'BLOQUEADO'

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  blocked ? 'bg-red-500 text-white' :
                  done    ? 'bg-green-500 text-white' :
                  active  ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                            'bg-gray-200 text-gray-500'
                }`}>
                  {blocked ? <AlertTriangle size={12} /> :
                   done    ? <Check size={12} /> :
                             idx + 1}
                </div>
                <span className={`text-[10px] mt-1 whitespace-nowrap ${
                  active ? 'font-bold text-blue-700' :
                  done   ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < visibleSteps.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 -mt-4 ${done || active ? 'bg-blue-300' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
