interface Testimonial {
  name: string
  role: string
  text: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    name: 'María G.',
    role: 'Tarotista, Plan L',
    text: 'Arcana Cloud transformó mi negocio. Ahora puedo atender más consultas y la IA me ayuda a dar interpretaciones más profundas y personalizadas.',
    rating: 5,
  },
  {
    name: 'Carlos R.',
    role: 'Tarotista, Plan M',
    text: 'El chat tipo WhatsApp es exactamente lo que necesitaba. Mis clientes se sienten cómodos y yo tengo todo organizado. El marketplace me trajo clientes nuevos.',
    rating: 5,
  },
  {
    name: 'Lucía M.',
    role: 'Tarotista, Plan S',
    text: 'Empecé con el plan gratuito y ya estoy pensando en upgrade. La facilidad de uso y el soporte son increíbles. Recomendado 100%.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
          Lo que dicen nuestros tarotistas
        </h2>
        <p className="text-purple-200/70 text-sm md:text-base">
          Miles de profesionales ya confían en Arcana Cloud para gestionar sus consultas.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {testimonials.map((t) => (
          <article key={t.name} className="bg-white/[0.04] backdrop-blur-xl rounded-xl md:rounded-2xl p-5 md:p-7 border border-white/[0.06] card-hover">
            <div className="flex gap-0.5 mb-3" aria-label={`${t.rating} de 5 estrellas`}>
              {Array.from({ length: t.rating }).map((_, i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <blockquote className="text-sm text-purple-200/80 leading-relaxed mb-4">
              &ldquo;{t.text}&rdquo;
            </blockquote>
            <footer className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-200" aria-hidden>
                {t.name.charAt(0)}
              </div>
              <div>
                <cite className="text-sm font-semibold not-italic">{t.name}</cite>
                <p className="text-[10px] text-purple-300/60">{t.role}</p>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}
