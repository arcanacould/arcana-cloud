interface PricingSectionProps {
  pricingRef: React.RefObject<HTMLDivElement | null>
  visible: boolean
  t: (key: string) => string
}

export function PricingSection({ pricingRef, visible, t }: PricingSectionProps) {
  const plans = [
    {
      name: t('landing.pricing.starter'),
      price: t('landing.pricing.free'),
      limit: t('landing.pricing.starterLimit'),
      feat: t('landing.pricing.starterFeat'),
      cta: t('landing.pricing.start'),
      popular: true,
    },
    {
      name: t('landing.pricing.pro'),
      price: t('landing.pricing.comingSoon'),
      limit: t('landing.pricing.proLimit'),
      feat: t('landing.pricing.proFeat'),
      cta: t('landing.pricing.notify'),
      popular: false,
    },
    {
      name: t('landing.pricing.legend'),
      price: t('landing.pricing.comingSoon'),
      limit: t('landing.pricing.legendLimit'),
      feat: t('landing.pricing.legendFeat'),
      cta: t('landing.pricing.notify'),
      popular: false,
    },
  ]

  return (
    <section ref={pricingRef} className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16 text-center">
      <div className={`${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} transition-all duration-800`}>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
          {t('landing.pricing.title')}
        </h2>
        <p className="text-purple-200/80 mb-8">{t('landing.pricing.subtitle')}</p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {plans.map((p, i) => (
            <article
              key={p.name}
              className={`card-hover group bg-white/[0.04] backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border shadow-xl relative ${
                p.popular ? 'border-indigo-400/40 md:scale-105 md:-mt-2' : 'border-white/[0.06]'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-medium shadow-lg shadow-indigo-500/30">
                  {t('landing.pricing.mostPopular')}
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{p.name}</h3>
              <p className="text-3xl font-bold text-indigo-300 mb-3">{p.price}</p>
              <p className="text-xs text-purple-200/70 mb-4">{p.limit}</p>
              <p className="text-sm text-purple-200/80 mb-6">{p.feat}</p>
              <button
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  p.popular
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25'
                    : 'bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10'
                }`}
              >
                {p.cta}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
