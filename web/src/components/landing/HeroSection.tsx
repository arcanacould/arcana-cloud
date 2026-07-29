import { Link } from 'react-router-dom'

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLDivElement | null>
  visible: boolean
  t: (key: string) => string
}

export function HeroSection({ heroRef, visible, t }: HeroSectionProps) {
  return (
    <section ref={heroRef} className="relative z-10 mx-auto pt-16 md:pt-24 pb-12 md:pb-16 text-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1747710977476-f494a948036e?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover opacity-20"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-purple-950/80 to-indigo-950/90" />
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="relative" aria-hidden>
          <span className="animate-float-slow absolute -top-12 left-[10%] text-4xl opacity-40 hidden md:block">🃏</span>
          <span className="animate-float-delayed absolute -top-8 right-[12%] text-3xl opacity-35 hidden md:block">🧿</span>
          <span className="animate-float-slower absolute top-[60%] -left-8 text-3xl opacity-30 hidden md:block">🌌</span>
          <span className="animate-float absolute top-[50%] -right-6 text-2xl opacity-30 hidden md:block">💫</span>
          <span className="animate-float-slow absolute -bottom-6 left-[30%] text-2xl opacity-25 hidden md:block">🕯️</span>
        </div>

        <div className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-purple-300/20 backdrop-blur-sm text-purple-200 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-glow" />
            {t('landing.badge')}
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
            {t('landing.hero.title')}
          </h2>

          <p className="text-sm sm:text-base md:text-xl text-purple-200/90 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.hero.desc')}
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/register"
              className="btn-shine relative px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-lg font-medium shadow-xl shadow-indigo-500/30 card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {t('landing.startFree')}
            </Link>
            <Link
              to="/marketplace"
              className="px-8 py-3.5 bg-white/5 backdrop-blur-sm rounded-xl text-lg font-medium border border-white/10 hover:bg-white/10 transition-all card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {t('landing.viewTarotistas')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
