import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

const NUMEROS_ROMANOS = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI']

export default function CartaDetail() {
  const { t } = useI18n()
  const { nombre } = useParams()
  const navigate = useNavigate()
  const [carta, setCarta] = useState<any>(null)

  useEffect(() => {
    if (!nombre) return
    fetch(`/api/ake/${encodeURIComponent(nombre)}`).then((r) => r.json()).then(setCarta).catch(() => setCarta(null))
  }, [nombre])

  if (!carta) return <p className="text-sm text-gray-500">{t('cartas.loading')}</p>

  const sections = [
    { label: t('carta.generalMeaning'), value: carta.significado_general },
    { label: t('carta.invertedMeaning'), value: carta.significado_invertido },
    { label: t('carta.love'), value: carta.significado_amor },
    { label: t('carta.work'), value: carta.significado_trabajo },
    { label: t('carta.health'), value: carta.significado_salud },
  ].filter((s) => s.value)

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/cartas')} className="text-sm text-indigo-600 hover:text-indigo-700 mb-4 block">&larr; {t('carta.back')}</button>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="mb-6 pb-6 border-b border-gray-100">
          <p className="text-3xl mb-2 text-indigo-600 font-serif">{NUMEROS_ROMANOS[carta.numero]}</p>
          <h2 className="text-2xl font-bold text-gray-900">{carta.nombre}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {carta.arcano === 'mayor' ? 'Arcano Mayor' : `${carta.palo} · Arcano Menor`}
            {carta.numero !== null && ` · Nº ${carta.numero}`}
          </p>
          {carta.keywords && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {carta.keywords.split(',').map((k: string) => (
                <span key={k} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-medium">{k.trim()}</span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {sections.map((s) => (
            <div key={s.label}>
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">{s.label}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
