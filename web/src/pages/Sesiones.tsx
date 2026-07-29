import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export default function Sesiones() {
  const [sesiones, setSesiones] = useState<any[]>([])
  const [consultantes, setConsultantes] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [consultanteId, setConsultanteId] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user?.email) return
    const { data: t } = await supabase.from('tarotista').select('id').eq('email', user.user.email).single()
    if (!t) return
    const { data: s } = await supabase.from('sesion').select('*, consultante(nombre)').eq('tarotista_id', t.id).order('created_at', { ascending: false })
    setSesiones(s || [])
    const { data: c } = await supabase.from('consultante').select('id, nombre').eq('tarotista_id', t.id).order('nombre')
    setConsultantes(c || [])
  }

  useEffect(() => { load() }, [])

  const createSesion = async () => {
    if (!consultanteId) return
    try {
      const data = await api('/api/sesiones', {
        method: 'POST',
        body: JSON.stringify({ consultante_id: consultanteId }),
      })
      setShowForm(false)
      if (data) navigate(`/sesiones/${data.id}`)
    } catch (err: any) { alert(err.message) }
  }

  const cambiarEstado = async (id: string, estado: string) => {
    const updates: any = { estado }
    if (estado === 'completada') updates.fecha_fin = new Date().toISOString()
    await supabase.from('sesion').update(updates).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Sesiones</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >+ Nueva sesión</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Consultante</label>
            <select value={consultanteId} onChange={(e) => setConsultanteId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="">Seleccionar...</option>
              {consultantes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <button onClick={createSesion} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Iniciar</button>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm">Cancelar</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100">
        {sesiones.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm text-center">No hay sesiones registradas</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="p-4 font-medium text-[11px] uppercase tracking-wider">Consultante</th>
                <th className="p-4 font-medium text-[11px] uppercase tracking-wider">Estado</th>
                <th className="p-4 font-medium text-[11px] uppercase tracking-wider">Inicio</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="p-4 text-sm font-medium text-gray-800">{s.consultante?.nombre || '—'}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                      s.estado === 'activa' ? 'bg-green-50 text-green-700' :
                      s.estado === 'completada' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
                    }`}>{s.estado}</span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">{new Date(s.fecha_inicio).toLocaleString()}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => navigate(`/sesiones/${s.id}`)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Ver</button>
                    {s.estado === 'activa' && (
                      <button onClick={() => cambiarEstado(s.id, 'completada')} className="text-xs text-green-600 hover:text-green-700 font-medium">Completar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
