import { useState } from 'react'

interface FAQItem {
  q: string
  a: string
}

const faqs: FAQItem[] = [
  {
    q: '¿Cómo funciona Arcana Cloud?',
    a: 'Arcana Cloud es una plataforma SaaS para tarotistas. Creás tu cuenta, configurás tu perfil y empezás a gestionar consultantes, realizar tiradas con IA y hacer crecer tu negocio esotérico.',
  },
  {
    q: '¿Necesito saber programación para usarlo?',
    a: 'No, para nada. Arcana Cloud está diseñado para que cualquier tarotista pueda usarlo sin conocimientos técnicos. La interfaz es intuitiva y similar a WhatsApp.',
  },
  {
    q: '¿Qué motores de IA puedo usar?',
    a: 'Podés elegir entre Gemini 2.0 Flash (gratuito), GPT-4o Mini o DeepSeek V4 Flash. Los motores se configuran desde la sección Perfil IA.',
  },
  {
    q: '¿Puedo empezar gratis?',
    a: 'Sí. El plan Starter es completamente gratuito e incluye hasta 50 consultantes y 100 sesiones por mes. Sin límite de tiempo.',
  },
  {
    q: '¿Cómo aparezco en el Marketplace?',
    a: 'Los tarotistas con plan M o L aparecen automáticamente en nuestro directorio público. Es una excelente forma de captar nuevos clientes.',
  },
]

export function FAQSection() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const toggle = (i: number) => {
    setFaqOpen(faqOpen === i ? null : i)
  }

  return (
    <section className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
          Preguntas frecuentes
        </h2>
        <p className="text-purple-200/70 text-sm md:text-base">
          Todo lo que necesitás saber sobre Arcana Cloud.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = faqOpen === i
          const panelId = `faq-panel-${i}`
          const buttonId = `faq-button-${i}`

          return (
            <div key={i} className="bg-white/[0.04] backdrop-blur-xl rounded-xl border border-white/[0.06] overflow-hidden">
              <h3>
                <button
                  id={buttonId}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm md:text-base font-medium text-white hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  {faq.q}
                  <span
                    className={`text-purple-300 transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >▼</span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
              >
                <p className="px-5 pb-4 text-sm text-purple-200/70 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
