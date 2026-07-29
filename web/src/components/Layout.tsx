import { ReactNode, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import NotificationBell from './NotificationBell'

const navItems = [
  { href: '/', icon: '📊', labelKey: 'layout.dashboard' },
  { href: '/chat', icon: '💬', labelKey: 'layout.chat' },
  { href: '/cartas', icon: '🔮', labelKey: 'layout.cards' },
  { href: '/perfil-ia', icon: '🤖', labelKey: 'layout.perfilIA' },
  { href: '/marketplace', icon: '🌐', labelKey: 'layout.marketplace' },
  { href: '/pagos', icon: '💰', label: 'Pagos' },
]

const bottomItems = [
  { href: '/configuracion', icon: '⚙️', labelKey: 'layout.config' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user?.email) return
      supabase.from('usuario').select('rol').eq('email', data.user.email).single().then(({ data: u }) => {
        setIsAdmin(u?.rol === 'admin')
      })
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-gray-950 text-gray-300 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-800">
          <h1 className="text-base font-bold text-white tracking-tight">Arcana Cloud</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">{t('layout.panel')}</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5" aria-label="Navegación principal">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? 'bg-gray-800 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {'labelKey' in item ? t(item.labelKey as string) : (item as any).label}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/admin') ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="text-base shrink-0">⚙️</span>
              {t('layout.admin')}
            </button>
          )}
        </nav>

        <div className="px-2 py-3 border-t border-gray-800 space-y-0.5">
          {bottomItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.href) ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {t(item.labelKey as string)}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <span className="text-base shrink-0">🚪</span>
            {t('layout.logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={() => navigate('/consultantes')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
          >Consultantes</button>
          <button
            onClick={() => navigate('/sesiones')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
          >Sesiones</button>
          <NotificationBell />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
