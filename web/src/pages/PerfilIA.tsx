import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'

export default function PerfilIA() {
  const { t } = useI18n()
  const [nombrePersona, setNombrePersona] = useState('')
  const [tono, setTono] = useState('')
  const [frases, setFrases] = useState('')
  const [estiloCierre, setEstiloCierre] = useState('')
  const [motorIa, setMotorIa] = useState('gemini')
  const [promptPersonalizado, setPromptPersonalizado] = useState('')
  const [puedeAvanzado, setPuedeAvanzado] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api('/api/perfil').then((data) => {
      if (data) {
        setNombrePersona(data.nombre_persona || '')
        setTono(data.tono || '')
        setFrases(data.frases_caracteristicas || '')
        setEstiloCierre(data.estilo_cierre || '')
        setMotorIa(data.motor_ia || 'gemini')
        setPromptPersonalizado(data.prompt_personalizado || '')
        setPuedeAvanzado(data.puede_avanzado || false)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage('')
    try {
      const body: any = { nombre_persona: nombrePersona, tono, frases_caracteristicas: frases, estilo_cierre: estiloCierre }
      if (puedeAvanzado) { body.motor_ia = motorIa; body.prompt_personalizado = promptPersonalizado }
      await api('/api/perfil', { method: 'PUT', body: JSON.stringify(body) })
      setMessage(t('perfil.saved'))
    } catch (err: any) { setMessage(`Error: ${err.message}`) }
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-gray-500">{t('app.loading')}</p>

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{t('perfil.title')}</h2>
      <p className="text-sm text-gray-500 mb-6">{t('perfil.subtitle')}</p>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('perfil.personaName')}</label>
            <input value={nombrePersona} onChange={(e) => setNombrePersona(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder={t('perfil.personaPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('perfil.tone')}</label>
            <select value={tono} onChange={(e) => setTono(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
              <option value="">{t('perfil.selectTone')}</option>
              <option value="cálido y empático">{t('perfil.toneWarm')}</option>
              <option value="directo y sincero">{t('perfil.toneDirect')}</option>
              <option value="místico y poético">{t('perfil.toneMystic')}</option>
              <option value="profesional y serio">{t('perfil.toneProfessional')}</option>
              <option value="motivacional y alentador">{t('perfil.toneMotivational')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('perfil.phrases')}</label>
            <textarea value={frases} onChange={(e) => setFrases(e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              placeholder={t('perfil.phrasesPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('perfil.closingStyle')}</label>
            <textarea value={estiloCierre} onChange={(e) => setEstiloCierre(e.target.value)} rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              placeholder={t('perfil.closingPlaceholder')} />
          </div>
        </div>

        {puedeAvanzado && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">⚙️ {t('perfil.advanced')}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('perfil.engine')}</label>
              <select value={motorIa} onChange={(e) => setMotorIa(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                <option value="gemini">{t('perfil.engineGemini')}</option>
                <option value="openai">{t('perfil.engineOpenAI')}</option>
                <option value="deepseek">{t('perfil.engineDeepSeek')}</option>
              </select>
              <p className="text-xs text-gray-400 mt-1.5">{t('perfil.engineDesc')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('perfil.customPrompt')}</label>
              <textarea value={promptPersonalizado} onChange={(e) => setPromptPersonalizado(e.target.value)} rows={5}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono resize-none"
                placeholder={t('perfil.customPromptPlaceholder')} />
              <p className="text-xs text-gray-400 mt-1.5">{t('perfil.customPromptDesc')}</p>
            </div>
          </div>
        )}

        {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        <button type="submit" disabled={saving}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
        >{saving ? t('perfil.saving') : t('perfil.save')}</button>
      </form>
    </div>
  )
}
