import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  leida: boolean
  created_at: string
}

const tipoColores: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  exito: 'bg-green-100 text-green-700',
  alerta: 'bg-amber-100 text-amber-700',
  pago: 'bg-indigo-100 text-indigo-700',
  sesion: 'bg-purple-100 text-purple-700',
}

const tipoIconos: Record<string, string> = {
  info: 'ℹ️',
  exito: '✅',
  alerta: '⚠️',
  pago: '💰',
  sesion: '📋',
}

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await api('/api/notificaciones')
      setNotificaciones(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const marcarLeida = async (id: string) => {
    await api(`/api/notificaciones/${id}/leer`, { method: 'PATCH' })
    setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n))
  }

  const marcarTodasLeidas = async () => {
    const ids = notificaciones.filter((n) => !n.leida).map((n) => n.id)
    if (ids.length === 0) return
    await api('/api/notificaciones/marcar-leidas', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    })
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  const eliminar = async (id: string) => {
    await api(`/api/notificaciones/${id}`, { method: 'DELETE' })
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notificaciones</h2>
          {noLeidas > 0 && <p className="text-sm text-gray-500 mt-1">{noLeidas} sin leer</p>}
        </div>
        {noLeidas > 0 && (
          <button onClick={marcarTodasLeidas}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >Marcar todas como leídas</button>
        )}
      </div>

      {notificaciones.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-400">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((n) => (
            <div key={n.id}
              className={`bg-white rounded-xl shadow-sm p-4 flex items-start gap-4 transition-colors ${
                !n.leida ? 'border-l-4 border-indigo-500' : 'opacity-70'
              }`}
            >
              <span className="text-xl mt-1" aria-hidden>{tipoIconos[n.tipo] || 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tipoColores[n.tipo] || 'bg-gray-100 text-gray-700'}`}>
                    {n.tipo}
                  </span>
                  <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{n.titulo}</p>
                <p className="text-xs text-gray-500 mt-1">{n.mensaje}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.leida && (
                  <button onClick={() => marcarLeida(n.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1"
                  >Leer</button>
                )}
                <button onClick={() => eliminar(n.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
