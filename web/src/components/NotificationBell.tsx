import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  leida: boolean
  created_at: string
}

const tipoIconos: Record<string, string> = {
  info: 'ℹ️', exito: '✅', alerta: '⚠️', pago: '💰', sesion: '📋',
}

export default function NotificationBell() {
  const [noLeidas, setNoLeidas] = useState(0)
  const [recientes, setRecientes] = useState<Notificacion[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null!)
  const navigate = useNavigate()

  const load = async () => {
    try {
      const data = await api('/api/notificaciones')
      const noLeidasList = data.filter((n: Notificacion) => !n.leida)
      setNoLeidas(noLeidasList.length)
      setRecientes(data.slice(0, 5))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const marcarLeida = async (id: string) => {
    await api(`/api/notificaciones/${id}/leer`, { method: 'PATCH' })
    load()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
      >
        🔔
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Notificaciones</p>
            <button onClick={() => { setOpen(false); navigate('/notificaciones') }}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >Ver todas</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recientes.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-8">Sin notificaciones</p>
            ) : (
              recientes.map((n) => (
                <div key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !n.leida ? 'bg-indigo-50/50' : ''
                  }`}
                  onClick={() => { if (!n.leida) marcarLeida(n.id) }}
                >
                  <span className="text-sm mt-0.5" aria-hidden>{tipoIconos[n.tipo] || 'ℹ️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{n.titulo}</p>
                    <p className="text-[10px] text-gray-500 truncate">{n.mensaje}</p>
                  </div>
                  {!n.leida && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
