import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

interface Tarotista {
  id: string
  nombre: string
  email: string
  foto_url: string | null
  descripcion_breve: string | null
  puntuacion: number | null
}

function StarRating({ rating }: { rating: number | null }) {
  const stars = rating ?? 0
  return (
    <div className="flex items-center gap-0.5" aria-label={`${stars.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= Math.round(stars) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {stars > 0 && (
        <span className="text-xs text-gray-400 ml-1">{stars.toFixed(1)}</span>
      )}
    </div>
  )
}

function Avatar({ nombre, fotoUrl }: { nombre: string; fotoUrl: string | null }) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={`Foto de ${nombre}`}
        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
        loading="lazy"
      />
    )
  }
  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-white shadow-sm">
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

export default function Marketplace() {
  const { t } = useI18n()
  const [tarotistas, setTarotistas] = useState<Tarotista[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://arcana-cloud.onrender.com/api/public/tarotistas')
      .then((r) => r.json())
      .then((data) => setTarotistas(data || []))
      .catch(() => setTarotistas([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('marketplace.backHome')}
        </Link>

        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">{t('marketplace.title')}</h2>
          <p className="text-gray-500 text-sm md:text-base">{t('marketplace.subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-gray-400">{t('marketplace.loading')}</span>
          </div>
        ) : tarotistas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4 opacity-50">🔮</p>
            <p className="text-gray-500 text-base">{t('marketplace.empty')}</p>
            <p className="text-gray-400 text-xs mt-1">{t('marketplace.emptyHint')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tarotistas.map((tar) => (
              <article
                key={tar.id}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 p-5"
              >
                <div className="flex items-start gap-4">
                  <Avatar nombre={tar.nombre} fotoUrl={tar.foto_url} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{tar.nombre}</h3>
                    {tar.puntuacion != null && tar.puntuacion > 0 && (
                      <div className="mt-1">
                        <StarRating rating={tar.puntuacion} />
                      </div>
                    )}
                  </div>
                </div>

                {tar.descripcion_breve && (
                  <p className="text-xs text-gray-500 leading-relaxed mt-3 line-clamp-3">
                    {tar.descripcion_breve}
                  </p>
                )}

                {tar.email && (
                  <p className="text-[11px] text-gray-300 mt-3 truncate">{tar.email}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
