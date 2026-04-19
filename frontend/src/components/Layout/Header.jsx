import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogOut, Plus, Bell, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
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
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const title = PAGE_TITLES[pathname] || 'CRM Inmobiliaria'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header 
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      className="border-b px-6 py-4 flex items-center justify-between shrink-0 transition-colors duration-300"
    >
      <h1 style={{ color: 'var(--text-main)' }} className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg hover:bg-[var(--bg-color)] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
        </button>

        {pathname === '/expedients' && (
          <Link to="/expedients/new" className="btn-primary">
            <Plus size={16} />
            Nuevo expediente
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg hover:bg-[var(--bg-color)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  )
}
