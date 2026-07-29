interface TrustItem {
  icon: string
  title: string
  desc: string
}

const items: TrustItem[] = [
  {
    icon: '⭐',
    title: 'Psíquicos 5 Estrellas',
    desc: 'Más de 4 millones de consultas satisfechas. Tarotistas verificados y valorados por nuestra comunidad.',
  },
  {
    icon: '🎯',
    title: 'Guía de expertos',
    desc: 'Asesores rigurosamente seleccionados con años de experiencia en tarot, videncia y espiritualidad.',
  },
  {
    icon: '🛡️',
    title: 'Garantía de satisfacción',
    desc: 'Si no estás conforme con tu lectura, te reembolsamos hasta $50. Tu confianza es primero.',
  },
]

export function TrustBanner() {
  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
        {items.map((item) => (
          <article
            key={item.title}
            className="bg-white/[0.04] backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-7 border border-white/[0.06] text-center card-hover"
          >
            <p className="text-2xl md:text-3xl mb-3" aria-hidden>{item.icon}</p>
            <h3 className="text-base md:text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-xs md:text-sm text-purple-200/70 leading-relaxed">{item.desc}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
