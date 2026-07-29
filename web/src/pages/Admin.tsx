import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'

export default function Admin() {
  const { t } = useI18n()
  const [tarotistas, setTarotistas] = useState<any[]>([])
  const [suscripciones, setSuscripciones] = useState<any[]>([])
  const [tab, setTab] = useState<'tarotistas' | 'suscripciones'>('tarotistas')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('S')
  const [message, setMessage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [passwordChangeId, setPasswordChangeId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [editSusc, setEditSusc] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState('')
  const [editFact, setEditFact] = useState('')
  const [editActiva, setEditActiva] = useState(true)

  const loadTarotistas = async () => {
    const { data: t } = await supabase.from('tarotista').select('*').order('created_at', { ascending: false })
    setTarotistas(t || [])
  }

  const loadSuscripciones = async () => {
    try {
      const data = await api('/api/auth/admin/suscripciones')
      setSuscripciones(data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user?.email) return
      const { data: u } = await supabase.from('usuario').select('rol').eq('email', user.user.email).single()
      setIsAdmin(u?.rol === 'admin')
      await Promise.all([loadTarotistas(), loadSuscripciones()])
    }
    checkAdmin()
  }, [])

  const crearTarotista = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMessage('')
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, nombre, rol: 'tarotista' }),
      })
      const { data: tarData } = await supabase.from('tarotista').select('*').eq('email', email).single()
      if (tarData && plan !== 'S') {
        await supabase.from('tarotista').update({ plan }).eq('id', tarData.id)
      }
      setMessage(`"${nombre}" ${t('admin.created')}`)
      setNombre(''); setEmail(''); setPassword('')
      await Promise.all([loadTarotistas(), loadSuscripciones()])
    } catch (err: any) { setMessage(`Error: ${err.message}`) }
    setLoading(false)
  }

  const eliminarTarotista = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a "${nombre}"? Todos sus datos se borrarán permanentemente.`)) return
    setDeletingId(id)
    try {
      await api(`/api/auth/admin/tarotista/${id}`, { method: 'DELETE' })
      await Promise.all([loadTarotistas(), loadSuscripciones()]); setMessage(`"${nombre}" eliminado`)
    } catch (err: any) { setMessage(`Error: ${err.message}`) }
    setDeletingId(null)
  }

  const cambiarPassword = async (id: string) => {
    if (!newPassword || newPassword.length < 6) { alert('La contraseña debe tener al menos 6 caracteres'); return }
    try {
      await api(`/api/auth/admin/tarotista/${id}/password`, {
        method: 'PATCH', body: JSON.stringify({ password: newPassword }),
      })
      setPasswordChangeId(null); setNewPassword(''); setMessage('Contraseña actualizada')
    } catch (err: any) { setMessage(`Error: ${err.message}`) }
  }

  const guardarSuscripcion = async (id: string) => {
    try {
      await api(`/api/auth/admin/suscripcion/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          plan: editPlan,
          suscripcion_activa: editActiva,
          proxima_facturacion: editFact || null,
        }),
      })
      setEditSusc(null)
      await loadSuscripciones()
      setMessage('Suscripción actualizada')
    } catch (err: any) { setMessage(`Error: ${err.message}`) }
  }

  if (!isAdmin) {
    return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700 text-sm">{t('admin.unauthorized')}</div>
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('admin.title')}</h2>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('tarotistas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'tarotistas' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >Tarotistas</button>
        <button onClick={() => setTab('suscripciones')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'suscripciones' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >Suscripciones</button>
      </div>

      {tab === 'tarotistas' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('admin.createTarotist')}</h3>
            <form onSubmit={crearTarotista} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder={t('admin.name')} value={nombre} onChange={(e) => setNombre(e.target.value)} required
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                <input placeholder={t('admin.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                <input placeholder={t('admin.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                <select value={plan} onChange={(e) => setPlan(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="S">{t('admin.plan')} S</option>
                  <option value="M">{t('admin.plan')} M</option>
                  <option value="L">{t('admin.plan')} L</option>
                </select>
              </div>
              {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >{loading ? t('admin.creating') : t('admin.create')}</button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('admin.registered')}</h3>
            {tarotistas.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('admin.noTarotists')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">{t('admin.name')}</th>
                      <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">{t('admin.email')}</th>
                      <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">{t('admin.plan')}</th>
                      <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">{t('admin.active')}</th>
                      <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">{t('admin.registration')}</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {tarotistas.map((tar) => (
                      <tr key={tar.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 text-sm font-medium text-gray-800">{tar.nombre}</td>
                        <td className="py-3 text-xs text-gray-500">{tar.email}</td>
                        <td className="py-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium">{tar.plan}</span>
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${tar.suscripcion_activa ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {tar.suscripcion_activa ? t('admin.yes') : t('admin.no')}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-gray-500">{new Date(tar.created_at).toLocaleDateString()}</td>
                        <td className="py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => eliminarTarotista(tar.id, tar.nombre)} disabled={deletingId === tar.id}
                              className="text-xs px-2.5 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >{deletingId === tar.id ? '...' : 'Eliminar'}</button>
                            {passwordChangeId === tar.id ? (
                              <div className="flex gap-1">
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña" minLength={6}
                                  className="w-28 px-2 py-1 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />
                                <button onClick={() => cambiarPassword(tar.id)}
                                  className="text-xs px-2.5 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors">OK</button>
                                <button onClick={() => { setPasswordChangeId(null); setNewPassword('') }}
                                  className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 transition-colors">X</button>
                              </div>
                            ) : (
                              <button onClick={() => { setPasswordChangeId(tar.id); setNewPassword('') }}
                                className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
                              >Contraseña</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'suscripciones' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Suscripciones y Facturación</h3>
          {suscripciones.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin datos de suscripción</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">Tarotista</th>
                    <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">Plan</th>
                    <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">Estado</th>
                    <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">Registro</th>
                    <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">Próxima facturación</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {suscripciones.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 text-sm font-medium text-gray-800">
                        {s.nombre}
                        <span className="text-xs text-gray-400 ml-2">{s.email}</span>
                      </td>
                      <td className="py-3">
                        {editSusc === s.id ? (
                          <select value={editPlan} onChange={(e) => setEditPlan(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                          </select>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium">{s.plan}</span>
                        )}
                      </td>
                      <td className="py-3">
                        {editSusc === s.id ? (
                          <select value={editActiva ? 'true' : 'false'} onChange={(e) => setEditActiva(e.target.value === 'true')}
                            className="px-2 py-1 border border-gray-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            <option value="true">Activa</option>
                            <option value="false">Inactiva</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${s.suscripcion_activa ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {s.suscripcion_activa ? 'Activa' : 'Inactiva'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-gray-500">{new Date(s.fecha_registro).toLocaleDateString()}</td>
                      <td className="py-3">
                        {editSusc === s.id ? (
                          <input type="date" value={editFact} onChange={(e) => setEditFact(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-36" />
                        ) : (
                          <span className="text-xs text-gray-500">
                            {s.proxima_facturacion ? new Date(s.proxima_facturacion).toLocaleDateString() : '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {editSusc === s.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => guardarSuscripcion(s.id)}
                              className="text-xs px-2.5 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors">OK</button>
                            <button onClick={() => setEditSusc(null)}
                              className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 transition-colors">X</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditSusc(s.id); setEditPlan(s.plan); setEditActiva(s.suscripcion_activa); setEditFact(s.proxima_facturacion || '') }}
                            className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
                          >Editar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
