import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'

const PLANES: Record<string, { label: string, consultantes: number, sesiones: number }> = {
  S: { label: 'Plan S', consultantes: 50, sesiones: 100 },
  M: { label: 'Plan M', consultantes: 200, sesiones: 500 },
  L: { label: 'Plan L', consultantes: -1, sesiones: -1 },
}

export default function Configuracion() {
  const { t } = useI18n()
  const [tarotista, setTarotista] = useState<any>(null)
  const [nombre, setNombre] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [descripcionBreve, setDescripcionBreve] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [passMessage, setPassMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user?.email) return
      const { data: t } = await supabase.from('tarotista').select('*').eq('email', user.user.email).single()
      if (t) {
        setTarotista(t)
        setNombre(t.nombre)
        setFotoUrl(t.foto_url || '')
        setDescripcionBreve(t.descripcion_breve || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        if (!base64) return

        const data = await api('/api/upload/foto', {
          method: 'POST',
          body: JSON.stringify({ base64, nombre: file.name }),
        })
        setFotoUrl(data.foto_url)
        setTarotista((prev: any) => ({ ...prev, foto_url: data.foto_url }))
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setMessage(`Error al subir foto: ${err.message}`)
      setUploading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const payload: Record<string, any> = { nombre }
      if (tarotista.plan === 'M' || tarotista.plan === 'L') {
        payload.descripcion_breve = descripcionBreve || null
      }
      await supabase.from('tarotista').update(payload).eq('id', tarotista.id)
      setTarotista({ ...tarotista, ...payload })
      setMessage(t('config.profileUpdated'))
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMessage('')
    try {
      await api('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      setPassMessage(t('config.passwordUpdated'))
      setCurrentPassword(''); setNewPassword('')
    } catch (err: any) {
      setPassMessage(`Error: ${err.message}`)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">{t('app.loading')}</p>

  const plan = tarotista ? PLANES[tarotista.plan as string] || PLANES.S : PLANES.S
  const showMarketplaceFields = tarotista.plan === 'M' || tarotista.plan === 'L'

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('config.title')}</h2>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">{t('config.subscription')}</h3>
        <div className="flex items-center gap-3 mt-3">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium">{plan.label}</span>
          <span className={`px-3 py-1 rounded-md text-sm font-medium ${
            tarotista?.suscripcion_activa ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {tarotista?.suscripcion_activa ? t('config.active') : t('config.inactive')}
          </span>
        </div>
        <div className="mt-3 text-sm text-gray-500">
          {plan.consultantes === -1 ? '∞' : plan.consultantes} {t('config.consultantsPerMonth')} · {plan.sesiones === -1 ? '∞' : plan.sesiones} {t('config.sessionsPerMonth')}
        </div>
        {tarotista?.proxima_facturacion && (
          <div className="mt-2 text-xs text-gray-400">
            Próxima facturación: {new Date(tarotista.proxima_facturacion).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('config.profile')}</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('config.name')}</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('config.email')}</label>
            <input value={tarotista?.email || ''} disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm" />
          </div>

          {showMarketplaceFields && (
            <>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Perfil de Marketplace</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto de perfil</label>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Foto de perfil" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 text-2xl border border-gray-200">
                        {tarotista?.nombre?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >{uploading ? 'Subiendo...' : 'Subir foto'}</button>
                    <p className="text-[11px] text-gray-400 mt-1">Formatos: JPG, PNG, WebP. Máx 5MB.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción breve</label>
                <textarea value={descripcionBreve} onChange={(e) => setDescripcionBreve(e.target.value)}
                  placeholder="Contale a los clientes quién sos y qué ofrecés..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                  rows={3} maxLength={300} />
                <p className="text-[10px] text-gray-400 mt-1">{descripcionBreve.length}/300 caracteres</p>
              </div>
            </>
          )}

          {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
          <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">{t('config.saveChanges')}</button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('config.changePassword')}</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('config.currentPassword')}</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('config.newPassword')}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          </div>
          {passMessage && <p className={`text-sm ${passMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{passMessage}</p>}
          <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">{t('config.updatePassword')}</button>
        </form>
      </div>
    </div>
  )
}
