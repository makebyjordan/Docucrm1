import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogOut, Plus, Bell } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/expedients': 'Expedientes',
  '/expedients/new': 'Nuevo expediente',
  '/clients': 'Clientes',
  '/users': 'Usuarios',
  '/settings': 'Configuración',
}

export default function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const logout = useAuthStore(s => s.logout)

  const title = PAGE_TITLES[pathname] || 'CRM Inmobiliaria'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        {pathname === '/expedients' && (
          <Link to="/expedients/new" className="btn-primary">
            <Plus size={16} />
            Nuevo expediente
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  )
}
