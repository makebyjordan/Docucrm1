import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Users, Settings,
  Building2, UserCog, Bell,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expedients', icon: FolderKanban, label: 'Expedientes' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/users', icon: UserCog, label: 'Usuarios', roles: ['DIRECCION', 'ADMINISTRACION'] },
  { to: '/settings', icon: Settings, label: 'Configuración', roles: ['DIRECCION', 'ADMINISTRACION'] },
]

export default function Sidebar() {
  const user = useAuthStore(s => s.user)

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">CRM Inmobiliaria</p>
          <p className="text-xs text-gray-400">Gestión documental</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems
          .filter(item => !item.roles || item.roles.includes(user?.role))
          .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>

      {/* Usuario */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
