import { Link } from 'react-router-dom'

interface FooterProps {
  t: (key: string) => string
}

interface LinkSection {
  title: string
  links: { labelKey: string; to: string }[]
}

interface ItemSection {
  title: string
  items: string[]
}

type FooterSection = LinkSection | ItemSection

const footerLinks: FooterSection[] = [
  {
    title: 'Arcana Cloud',
    links: [
      { labelKey: 'landing.marketplace', to: '/marketplace' },
      { labelKey: 'landing.login', to: '/login' },
      { labelKey: 'landing.register', to: '/register' },
    ],
  },
  {
    title: 'Plataforma',
    items: ['Chat inteligente', 'Tiradas con IA', 'CRM completo', 'Marketplace'],
  },
  {
    title: 'Planes',
    items: ['Starter — Gratis', 'Profesional — Pronto', 'Legend — Pronto'],
  },
  {
    title: 'Soporte',
    items: ['soporte@arcanacloud.com', '24/7 disponible'],
  },
]

export function Footer({ t }: FooterProps) {
  return (
    <footer className="relative z-10 border-t border-white/5 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 text-left">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {'links' in section
                  ? section.links.map((link) => (
                      <li key={link.labelKey}>
                        <Link
                          to={link.to}
                          className="text-xs text-purple-300/60 hover:text-purple-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                        >
                          {t(link.labelKey)}
                        </Link>
                      </li>
                    ))
                  : section.items.map((item) => (
                      <li key={item}>
                        <span className="text-xs text-purple-300/60">{item}</span>
                      </li>
                    ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center text-purple-300/50 text-xs pt-6 border-t border-white/5">
          Arcana Cloud &copy; {new Date().getFullYear()} &mdash; {t('landing.footer')} 💜
        </div>
      </div>
    </footer>
  )
}
