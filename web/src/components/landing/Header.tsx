import { Link } from 'react-router-dom'

interface HeaderProps {
  lang: string
  onToggleLang: () => void
  t: (key: string) => string
}

export function Header({ lang, onToggleLang, t }: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 max-w-6xl mx-auto">
      <h1 className="text-lg md:text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent shrink-0">
        Arcana Cloud
      </h1>
      <nav className="flex items-center gap-1.5 md:gap-3 flex-wrap justify-end" aria-label="Navegación principal">
        <button
          onClick={onToggleLang}
          className="text-[10px] md:text-xs px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'}
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
        <Link
          to="/marketplace"
          className="text-[11px] md:text-sm text-purple-200 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
        >
          {t('landing.marketplace')}
        </Link>
        <Link
          to="/login"
          className="text-[11px] md:text-sm px-2 md:px-4 py-1 md:py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {t('landing.login')}
        </Link>
        <Link
          to="/register"
          className="text-[11px] md:text-sm px-2 md:px-4 py-1 md:py-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {t('landing.register')}
        </Link>
      </nav>
    </header>
  )
}
