import { useI18n } from '../lib/i18n'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { LandingAnimations } from '../components/landing/LandingAnimations'
import { AnimatedBackground } from '../components/landing/AnimatedBackground'
import { Header } from '../components/landing/Header'
import { HeroSection } from '../components/landing/HeroSection'
import { TrustBanner } from '../components/landing/TrustBanner'
import { ImageDivider } from '../components/landing/ImageDivider'
import { FeaturesSection } from '../components/landing/FeaturesSection'
import { Testimonials } from '../components/landing/Testimonials'
import { PricingSection } from '../components/landing/PricingSection'
import { FAQSection } from '../components/landing/FAQSection'
import { Footer } from '../components/landing/Footer'

export default function Landing() {
  const { t, lang, setLang } = useI18n()
  const { ref: heroRef, visible: heroVis } = useScrollReveal(0.1)
  const { ref: featRef, visible: featVis } = useScrollReveal(0.1)
  const { ref: pricingRef, visible: pricingVis } = useScrollReveal(0.1)

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <LandingAnimations />
      <AnimatedBackground />

      <Header lang={lang} onToggleLang={() => setLang(lang === 'es' ? 'en' : 'es')} t={t} />

      <main>
        <HeroSection heroRef={heroRef} visible={heroVis} t={t} />
        <TrustBanner />
        <ImageDivider
          src="https://images.unsplash.com/photo-1694144167581-8bc49479f6b7?w=1200&q=80"
          alt=""
          position="left"
        >
          <p className="text-xl md:text-4xl font-bold mb-1 md:mb-3 text-white">✨ {t('landing.badge')}</p>
          <p className="text-purple-200/80 text-xs md:text-base leading-relaxed line-clamp-3 md:line-clamp-none">
            {t('landing.hero.desc')}
          </p>
        </ImageDivider>
        <FeaturesSection featRef={featRef} visible={featVis} t={t} />
        <ImageDivider
          src="https://images.unsplash.com/photo-1753797782254-4ef6719c7bcd?w=1200&q=80"
          alt=""
          position="right"
        >
          <p className="text-lg md:text-3xl font-bold text-white mb-1 md:mb-2">{t('landing.pricing.title')}</p>
          <p className="text-purple-200/70 text-xs md:text-sm">{t('landing.pricing.subtitle')}</p>
        </ImageDivider>
        <Testimonials />
        <PricingSection pricingRef={pricingRef} visible={pricingVis} t={t} />
        <FAQSection />
      </main>

      <Footer t={t} />
    </div>
  )
}
