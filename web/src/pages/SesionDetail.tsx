import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

interface CartaTirada {
  nombre_carta: string
  posicion: number
  es_invertida: boolean
}

export default function SesionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sesion, setSesion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSelector, setShowSelector] = useState(false)
  const [cartasDisponibles, setCartasDisponibles] = useState<any[]>([])
  const [cartasSeleccionadas, setCartasSeleccionadas] = useState<CartaTirada[]>([])
  const [tipoTirada, setTipoTirada] = useState('tres')
  const [pregunta, setPregunta] = useState('')
  const [interpretando, setInterpretando] = useState(false)
  const [interpretacion, setInterpretacion] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try { setSesion(await api(`/api/sesiones/${id}`)) } catch { setSesion(null) }
      setLoading(false)
    }
    load()
  }, [id])

  const abrirSelector = async (tipo: string) => {
    setTipoTirada(tipo)
    const cartas = await api('/api/ake?select=nombre,arcano,palo,numero')
    setCartasDisponibles(cartas)
    setCartasSeleccionadas([])
    setShowSelector(true)
  }

  const toggleCarta = (nombre: string) => {
    const existe = cartasSeleccionadas.find((c) => c.nombre_carta === nombre)
    if (existe) {
      setCartasSeleccionadas(cartasSeleccionadas.filter((c) => c.nombre_carta !== nombre))
    } else {
      if (cartasSeleccionadas.length >= 10) return
      setCartasSeleccionadas([...cartasSeleccionadas, { nombre_carta: nombre, posicion: cartasSeleccionadas.length + 1, es_invertida: false }])
    }
  }

  const toggleInvertida = (nombre: string) => {
    setCartasSeleccionadas(cartasSeleccionadas.map((c) =>
      c.nombre_carta === nombre ? { ...c, es_invertida: !c.es_invertida } : c
    ))
  }

  const guardarTirada = async () => {
    if (cartasSeleccionadas.length === 0) return
    setError('')
    try {
      const data = await api('/api/tiradas', {
        method: 'POST',
        body: JSON.stringify({ sesion_id: id, tipo: tipoTirada, pregunta: pregunta || undefined, cartas: cartasSeleccionadas }),
      })
      setShowSelector(false)
      interpretarTirada(data.tirada.id)
    } catch (err: any) { setError(err.message) }
  }

  const interpretarTirada = async (tiradaId: string) => {
    setInterpretando(true)
    try {
      const data = await api('/api/tiradas/interpretar', { method: 'POST', body: JSON.stringify({ tirada_id: tiradaId }) })
      setInterpretacion(data)
      setInterpretando(false)
      setSesion(await api(`/api/sesiones/${id}`))
    } catch (err: any) { setError(err.message); setInterpretando(false) }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando...</p>
  if (!sesion) return <p className="text-sm text-red-500">Sesión no encontrada</p>

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/sesiones')} className="text-sm text-indigo-600 hover:text-indigo-700 mb-4 block">&larr; Volver</button>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{sesion.consultante?.nombre || 'Sesión'}</h2>
            <p className="text-xs text-gray-500 mt-1">
              Inicio: {new Date(sesion.fecha_inicio).toLocaleString()}
              {sesion.fecha_fin && ` · Fin: ${new Date(sesion.fecha_fin).toLocaleString()}`}
            </p>
          </div>
          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${
            sesion.estado === 'activa' ? 'bg-green-50 text-green-700' :
            sesion.estado === 'completada' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
          }`}>{sesion.estado}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => abrirSelector('tres')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Tirada 3 cartas</button>
          <button onClick={() => abrirSelector('cruz')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Cruz Celta</button>
          <button onClick={() => abrirSelector('si-no')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Sí / No</button>
        </div>
        {sesion.tirada?.length > 0 && (
          <button onClick={() => navigate(`/sesiones/${id}/reporte`)}
            className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium"
          >📄 Exportar PDF</button>
        )}
      </div>

      {showSelector && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">
              {tipoTirada === 'tres' ? 'Tirada de 3 cartas' : tipoTirada === 'cruz' ? 'Cruz Celta' : 'Sí / No'}
            </h3>
            <button onClick={() => setShowSelector(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Pregunta (opcional)</label>
            <input value={pregunta} onChange={(e) => setPregunta(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder="¿Qué quiere consultar?" />
          </div>

          {cartasSeleccionadas.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Cartas seleccionadas:</p>
              <div className="flex flex-wrap gap-1.5">
                {cartasSeleccionadas.map((c) => (
                  <div key={c.nombre_carta} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs">
                    <span className="font-medium text-indigo-700">#{c.posicion}</span>
                    <span className={c.es_invertida ? 'text-red-500' : 'text-gray-700'}>{c.nombre_carta}</span>
                    <button onClick={() => toggleInvertida(c.nombre_carta)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${c.es_invertida ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}
                    >{c.es_invertida ? 'Inv' : 'Rec'}</button>
                    <button onClick={() => toggleCarta(c.nombre_carta)} className="text-red-400 hover:text-red-600 ml-0.5">&times;</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto mb-4 border border-gray-100 rounded-lg p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 mb-2">
              {cartasDisponibles.filter((c) => c.arcano === 'mayor').map((c) => (
                <button key={c.nombre} onClick={() => toggleCarta(c.nombre)}
                  className={`text-[11px] p-1.5 rounded-lg border text-center transition-colors ${
                    cartasSeleccionadas.find((cs) => cs.nombre_carta === c.nombre)
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                      : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                  }`}>{c.nombre}</button>
              ))}
            </div>
            {['bastos', 'copas', 'espadas', 'oros'].map((palo) => (
              <div key={palo} className="mt-2">
                <p className="text-[11px] font-medium text-gray-400 mb-1 capitalize">{palo}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                  {cartasDisponibles.filter((c) => c.palo === palo).map((c) => (
                    <button key={c.nombre} onClick={() => toggleCarta(c.nombre)}
                      className={`text-[11px] p-1.5 rounded-lg border text-center transition-colors ${
                        cartasSeleccionadas.find((cs) => cs.nombre_carta === c.nombre)
                          ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                          : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                      }`}>{c.nombre}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={guardarTirada} disabled={cartasSeleccionadas.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">Guardar e interpretar</button>
            <button onClick={() => setShowSelector(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {interpretando && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5 text-center">
          <p className="text-sm text-indigo-600 font-medium">Interpretando las cartas...</p>
          <div className="mt-2 animate-pulse text-3xl">🔮</div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {sesion.tirada?.length > 0 && (
        <div className="space-y-5">
          {sesion.tirada.map((t: any) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 capitalize">
                    {t.tipo === 'tres' ? 'Tirada de 3 cartas' : t.tipo === 'cruz' ? 'Cruz Celta' : 'Tirada'}
                  </h3>
                  {t.pregunta && <p className="text-xs text-gray-500 mt-0.5">"{t.pregunta}"</p>}
                </div>
                <span className="text-[11px] text-gray-400">{new Date(t.created_at).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {t.carta?.map((c: any) => (
                  <div key={c.id} className="border border-gray-100 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-gray-400 mb-1">#{c.posicion}</p>
                    <p className={`text-sm font-medium ${c.es_invertida ? 'text-red-500' : 'text-gray-800'}`}>{c.nombre_carta}</p>
                    {c.es_invertida && <p className="text-[10px] text-red-400">Invertida</p>}
                  </div>
                ))}
              </div>
              {t.carta?.some((c: any) => c.interpretacion?.length > 0) && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Interpretaciones</h4>
                  {t.carta.map((c: any) => c.interpretacion?.map((i: any) => (
                    <div key={i.id} className="bg-indigo-50/50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed border border-indigo-100/50">
                      <p className="font-medium text-indigo-700 mb-1">{c.nombre_carta}</p>
                      {i.contenido}
                    </div>
                  )))}
                </div>
              )}
            </div>
          ))}
          {interpretacion?.interpretacion_general && !showSelector && (
            <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl border border-indigo-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Lectura completa 🔮</h3>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{interpretacion.interpretacion_general}</div>
            </div>
          )}
        </div>
      )}

      {(!sesion.tirada || sesion.tirada.length === 0) && !showSelector && !interpretando && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400">
          <p className="text-3xl mb-2">🃏</p>
          <p className="text-sm">No hay tiradas en esta sesión aún.</p>
          <p className="text-xs mt-1 text-gray-300">Seleccioná un tipo de tirada arriba para empezar.</p>
        </div>
      )}
    </div>
  )
}
