import { Check, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

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

// Fases específicas del proceso de INQUILINO
const INQUILINO_STEPS = [
  { id: 'CAPTACION', label: 'Contacto' },
  { id: 'FORMULARIO', label: 'Datos' },
  { id: 'DOCUMENTACION', label: 'Docs.' },
  { id: 'VALIDACION', label: 'Solvencia' },
  { id: 'VISITAS', label: 'Visitas' },
  { id: 'NEGOCIACION', label: 'Negociac.' },
  { id: 'ACUERDO_INTERESADO', label: 'Acuerdo' },
  { id: 'CIERRE', label: 'Contrato' },
  { id: 'POSVENTA', label: 'Seguim.' },
]

// Fases específicas del proceso de PROPIETARIO (Alquiler)
const PROPIETARIO_STEPS = [
  { id: 'CAPTACION', label: 'Captación' },
  { id: 'VALORACION', label: 'Valorac.' },
  { id: 'FORMULARIO', label: 'Formaliz.' },
  { id: 'DOCUMENTACION', label: 'Docs.' },
  { id: 'ACUERDO', label: 'Mandato' },
  { id: 'MARKETING_FORMULARIO', label: 'Brief' },
  { id: 'MARKETING_EJECUCION', label: 'G. Mkt' },
  { id: 'VISITAS', label: 'Visitas' },
  { id: 'NEGOCIACION', label: 'Negociac.' },
  { id: 'CIERRE', label: 'Contrato' },
  { id: 'POSVENTA', label: 'Gestión' },
]

// Fases específicas del proceso de INVERSOR
const INVERSOR_STEPS = [
  { id: 'CAPTACION', label: 'Perfilado' },
  { id: 'FORMULARIO', label: 'Criterios' },
  { id: 'DOCUMENTACION', label: 'KYC' },
  { id: 'BUSQUEDA_ACTIVA', label: 'Búsqueda' },
  { id: 'VALORACION', label: 'Análisis' },
  { id: 'VISITAS', label: 'Visitas' },
  { id: 'NEGOCIACION', label: 'Oferta' },
  { id: 'ARRAS', label: 'Reserva' },
  { id: 'CIERRE', label: 'Compra' },
  { id: 'POSVENTA', label: 'Gestión' },
]

export default function WorkflowStepper({ currentPhase, status, operationType }) {
  const { data: checklistTemplates } = useQuery({
    queryKey: ['checklist-templates', operationType],
    queryFn: () => api.get('/checklists/templates', { params: { operationType } }).then(r => r.data),
  })

  // Generar pasos dinámicamente desde la base de datos
  const dbSteps = checklistTemplates
    ?.sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(t => ({ id: t.phase, label: t.name }));

  const visibleSteps = dbSteps && dbSteps.length > 0 
    ? dbSteps 
    : STEPS.filter(step => {
        if (operationType === 'COMPRA' && step.id === 'VALORACION') return false;
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
                  blocked ? 'bg-[var(--sidebar-bg)]0 text-white' :
                  done    ? 'bg-[var(--sidebar-bg)]0 text-white' :
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
