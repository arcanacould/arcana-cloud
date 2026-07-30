import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

const NUMEROS_ROMANOS = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI']
const PALOS = ['bastos', 'copas', 'espadas', 'oros'] as const
const PALO_ICONS: Record<string, string> = { bastos: '🔥', copas: '💧', espadas: '💨', oros: '🌍' }

export default function Cartas() {
  const { t } = useI18n()
  const [mayores, setMayores] = useState<any[]>([])
  const [menores, setMenores] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'mayores' | 'menores'>('mayores')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetch('https://arcana-cloud.onrender.com/api/ake/arcanos-mayores').then((r) => r.json()).then(setMayores)
    fetch('https://arcana-cloud.onrender.com/api/ake/arcanos-menores').then((r) => r.json()).then(setMenores)
  }, [])

  const filterCards = (cards: any[]) => {
    if (!search.trim()) return cards
    const q = search.toLowerCase()
    return cards.filter((c) => c.nombre.toLowerCase().includes(q) || (c.significado_general || '').toLowerCase().includes(q))
  }

  const mayoresFiltrados = filterCards(mayores)
  const menoresFiltrados = filterCards(menores)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('cartas.title')}</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            placeholder={t('cartas.search')} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('mayores')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'mayores' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >{t('cartas.major')} ({mayoresFiltrados.length})</button>
          <button onClick={() => setActiveTab('menores')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'menores' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >{t('cartas.minor')} ({menoresFiltrados.length})</button>
        </div>
      </div>

      {search && (
        <p className="text-xs text-gray-500 mb-4">
          {mayoresFiltrados.length + menoresFiltrados.length} {t('cartas.resultsFor')} &ldquo;{search}&rdquo;
        </p>
      )}

      {activeTab === 'mayores' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mayoresFiltrados.map((c) => (
            <button key={c.id} onClick={() => navigate(`/cartas/${encodeURIComponent(c.nombre)}`)}
              className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <p className="text-xl mb-1 text-indigo-600 font-serif">{NUMEROS_ROMANOS[c.numero]}</p>
              <p className="text-sm font-semibold text-gray-800">{c.nombre}</p>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'menores' && PALOS.map((palo) => {
        const cartas = menoresFiltrados.filter((c) => c.palo === palo)
        if (cartas.length === 0) return null
        return (
          <div key={palo} className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>{PALO_ICONS[palo]}</span>
              {palo.charAt(0).toUpperCase() + palo.slice(1)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {cartas.map((c) => (
                <button key={c.id} onClick={() => navigate(`/cartas/${encodeURIComponent(c.nombre)}`)}
                  className="bg-white rounded-xl border border-gray-100 p-3 text-center hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-medium text-gray-800">{c.nombre}</p>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {mayoresFiltrados.length === 0 && menoresFiltrados.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-16">{t('cartas.noResults')} &ldquo;{search}&rdquo;</p>
      )}
    </div>
  )
}
