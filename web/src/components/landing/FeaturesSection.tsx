interface FeatureCard {
  icon: string
  title: string
  desc: string
}

interface FeaturesSectionProps {
  featRef: React.RefObject<HTMLDivElement | null>
  visible: boolean
  t: (key: string) => string
}

export function FeaturesSection({ featRef, visible, t }: FeaturesSectionProps) {
  const features: FeatureCard[] = [
    { icon: '🔮', title: t('landing.feature.ai'), desc: t('landing.feature.aiDesc') },
    { icon: '💬', title: t('landing.feature.chat'), desc: t('landing.feature.chatDesc') },
    { icon: '📊', title: t('landing.feature.crm'), desc: t('landing.feature.crmDesc') },
    { icon: '🌐', title: t('landing.feature.marketplace'), desc: t('landing.feature.marketplaceDesc') },
    { icon: '⚙️', title: t('landing.feature.multiAi'), desc: t('landing.feature.multiAiDesc') },
    { icon: '🎨', title: t('landing.feature.custom'), desc: t('landing.feature.customDesc') },
  ]

  return (
    <section ref={featRef} className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" aria-hidden />

      <div className={`grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} transition-all duration-800`}>
        {features.map((f, i) => (
          <article
            key={f.title}
            className="card-hover group bg-white/[0.04] backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/[0.06] shadow-xl"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden />
              <p className="text-3xl mb-3 relative" aria-hidden>{f.icon}</p>
              <h3 className="text-lg font-semibold mb-2 relative">{f.title}</h3>
              <p className="text-sm text-purple-200/80 leading-relaxed relative">{f.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
