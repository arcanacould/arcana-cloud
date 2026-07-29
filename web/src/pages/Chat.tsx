import { useEffect, useState, useRef } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'

export default function Chat() {
  const { t } = useI18n()
  const [chats, setChats] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [conversacion, setConversacion] = useState<any>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [tipoMsg, setTipoMsg] = useState<'cliente' | 'tarotista'>('cliente')
  const [enviando, setEnviando] = useState(false)
  const [showTiradaModal, setShowTiradaModal] = useState(false)
  const [cartasDisponibles, setCartasDisponibles] = useState<any[]>([])
  const [cartasSeleccionadas, setCartasSeleccionadas] = useState<any[]>([])
  const [tipoTirada, setTipoTirada] = useState('tres')
  const [preguntaTirada, setPreguntaTirada] = useState('')
  const [interpretando, setInterpretando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const msgsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conversacion?.mensajes])

  const loadChats = async () => {
    try { const data = await api('/api/chat'); setChats(data || []) } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { loadChats() }, [])

  const selectChat = async (id: string) => {
    setSelectedId(id); setMensaje('')
    try { const data = await api(`/api/chat/${id}`); setConversacion(data) } catch { setConversacion(null) }
  }

  const createChat = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api('/api/chat/start', { method: 'POST', body: JSON.stringify({ nombre, fecha_nacimiento: fechaNac || undefined, motivo }) })
      setShowNewModal(false); setNombre(''); setFechaNac(''); setMotivo('')
      await loadChats()
    } catch (err: any) { alert(err.message) }
  }

  const cerrarSesion = async () => {
    if (!selectedId || cerrando) return
    setCerrando(true)
    try {
      await api(`/api/chat/${selectedId}/cerrar`, { method: 'POST' })
      await loadChats(); setSelectedId(null); setConversacion(null)
    } catch (err: any) { alert(err.message) }
    setCerrando(false)
  }

  const enviarMensaje = async () => {
    if (!mensaje.trim() || !selectedId || enviando) return
    setEnviando(true)
    const texto = mensaje; setMensaje('')
    try {
      await api(`/api/chat/${selectedId}/mensaje`, { method: 'POST', body: JSON.stringify({ contenido: texto, tipo: tipoMsg }) })
      setConversacion(await api(`/api/chat/${selectedId}`))
      loadChats()
    } catch (err: any) { alert(err.message) }
    setEnviando(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() }
  }

  const abrirTirada = async (tipo: string) => {
    setTipoTirada(tipo)
    try { const cartas = await api('/api/ake?select=nombre,arcano,palo,numero'); setCartasDisponibles(cartas) } catch { setCartasDisponibles([]) }
    setCartasSeleccionadas([]); setPreguntaTirada(''); setBusqueda(''); setShowTiradaModal(true)
  }

  const toggleCarta = (nombre: string) => {
    const existe = cartasSeleccionadas.find((c) => c.nombre_carta === nombre)
    if (existe) { setCartasSeleccionadas(cartasSeleccionadas.filter((c) => c.nombre_carta !== nombre)) }
    else { if (cartasSeleccionadas.length >= 10) return; setCartasSeleccionadas([...cartasSeleccionadas, { nombre_carta: nombre, posicion: cartasSeleccionadas.length + 1, es_invertida: false }]) }
  }

  const toggleInvertida = (nombre: string) => {
    setCartasSeleccionadas(cartasSeleccionadas.map((c) => c.nombre_carta === nombre ? { ...c, es_invertida: !c.es_invertida } : c))
  }

  const guardarTiradaModal = async () => {
    if (cartasSeleccionadas.length === 0 || !conversacion) return
    setInterpretando(true)
    try {
      const textoCartas = `Tirada de ${tipoTirada}: ${cartasSeleccionadas.map((c) => `${c.nombre_carta}${c.es_invertida ? ' (inv)' : ''}`).join(', ')}${preguntaTirada ? `\nPregunta: ${preguntaTirada}` : ''}`
      await api(`/api/chat/${conversacion.consultante.id}/mensaje`, { method: 'POST', body: JSON.stringify({ contenido: textoCartas, tipo: 'tarotista' }) })
      setShowTiradaModal(false); setInterpretando(false)
      setConversacion(await api(`/api/chat/${conversacion.consultante.id}`))
    } catch (err: any) { alert(err.message); setInterpretando(false) }
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const hoy = new Date(); const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)
    if (date.toDateString() === hoy.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (date.toDateString() === ayer.toDateString()) return 'Ayer'
    return date.toLocaleDateString()
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] -m-6">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">{t('chat.title')}</h2>
          <button onClick={() => setShowNewModal(true)}
            className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 text-lg leading-none"
          >+</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-xs text-gray-400 text-center">{t('chat.loading')}</p>
          ) : chats.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center">{t('chat.noConsultants')}</p>
          ) : (
            chats.map((c) => (
              <button key={c.id} onClick={() => selectChat(c.id)}
                className={`w-full text-left p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedId === c.id ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.nombre}</p>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatDate(c.ultima_actividad)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.ultimo_mensaje || t('chat.noActivity')}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-3 opacity-60">💬</p>
              <p className="text-sm">{t('chat.selectChat')}</p>
              <p className="text-xs mt-1 text-gray-300">{t('chat.orCreate')}</p>
            </div>
          </div>
        ) : !conversacion ? (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400">{t('chat.loading')}</div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                {conversacion.consultante.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{conversacion.consultante.nombre}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {conversacion.consultante.fecha_nacimiento && `Nac: ${conversacion.consultante.fecha_nacimiento}`}
                  {conversacion.consultante.motivo && ` · ${conversacion.consultante.motivo}`}
                </p>
              </div>
              <button onClick={cerrarSesion} disabled={cerrando}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors shrink-0"
              >{cerrando ? t('chat.closing') : t('chat.closeSession')}</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversacion.mensajes?.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-12">{t('chat.firstMessage')}</p>
              ) : (
                conversacion.mensajes?.map((msg: any, idx: number) => {
                  const prev = idx > 0 ? conversacion.mensajes[idx - 1] : null
                  const msgDate = new Date(msg.created_at).toDateString()
                  const prevDate = prev ? new Date(prev.created_at).toDateString() : null
                  const showDateSep = msgDate !== prevDate
                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="text-center mb-2">
                          <span className="text-[10px] bg-gray-200/80 text-gray-500 px-2.5 py-1 rounded-full">
                            {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                        </div>
                      )}
                      {msg.tipo === 'contexto' && (
                        <div className="flex justify-start">
                          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[80%] shadow-sm">
                            <p className="text-[10px] text-yellow-600 font-medium mb-1">📝 {t('chat.contextLabel')}</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{msg.contenido}</p>
                          </div>
                        </div>
                      )}
                      {msg.tipo === 'tirada_pregunta' && (
                        <div className="flex justify-end">
                          <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[75%] text-sm leading-relaxed shadow-sm whitespace-pre-line">
                            {msg.contenido}
                          </div>
                        </div>
                      )}
                      {msg.tipo === 'tirada_respuesta' && (
                        <div className="flex justify-start">
                          <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[85%] shadow-sm border border-gray-100">
                            <p className="text-[10px] text-purple-600 font-medium mb-1">🔮 {t('chat.readingLabel')}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(msg.contenido.carta || []).map((c: any) => (
                                <span key={c.id}
                                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${c.es_invertida ? 'border-red-200 text-red-600 bg-red-50' : 'border-indigo-200 text-indigo-600 bg-indigo-50'}`}
                                >{c.nombre_carta}{c.es_invertida ? ' (inv)' : ''}</span>
                              ))}
                            </div>
                            {(msg.contenido.carta || []).some((c: any) => c.interpretacion?.length > 0) && (
                              <div className="space-y-1.5">
                                {(msg.contenido.carta || []).map((c: any) => c.interpretacion?.map((i: any) => (
                                  <p key={i.id} className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                                    <span className="font-medium text-indigo-700">{c.nombre_carta}:</span> {i.contenido}
                                  </p>
                                )))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {msg.tipo === 'ia_respuesta' && (
                        <div className="flex justify-start">
                          <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[85%] shadow-sm border border-gray-100">
                            <p className="text-[10px] text-purple-600 font-medium mb-1">🔮 {t('chat.interpretationLabel')}</p>
                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{msg.contenido}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={msgsEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <button onClick={() => setTipoMsg('cliente')}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${tipoMsg === 'cliente' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}
                >🙋 {t('chat.clientLabel')}</button>
                <button onClick={() => setTipoMsg('tarotista')}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${tipoMsg === 'tarotista' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}
                >🔮 {t('chat.tarotistLabel')}</button>
              </div>
              <div className="flex items-end gap-1.5">
                <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} onKeyDown={handleKeyDown} rows={1}
                  placeholder={tipoMsg === 'cliente' ? t('chat.clientPlaceholder') : t('chat.tarotistPlaceholder')}
                  className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none max-h-24"
                />
                <div className="flex gap-1">
                  <button onClick={() => abrirTirada('tres')} title={t('chat.cardSelector')}
                    className="w-9 h-9 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors shrink-0 text-sm"
                  >🃏</button>
                  <button onClick={enviarMensaje} disabled={enviando || !mensaje.trim()}
                    className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0 text-sm"
                  >➤</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showTiradaModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">
                {tipoTirada === 'tres' ? t('chat.modalTitle3') : tipoTirada === 'cruz' ? t('chat.modalTitleCross') : t('chat.modalTitleYesNo')}
              </h3>
              <button onClick={() => setShowTiradaModal(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <div className="flex gap-1 mb-4">
              {(['tres', 'cruz', 'si-no'] as const).map((tt) => (
                <button key={tt} onClick={() => abrirTirada(tt)}
                  className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${tipoTirada === tt ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >{tt === 'tres' ? t('chat.threeCards') : tt === 'cruz' ? t('chat.cross') : t('chat.yesNo')}</button>
              ))}
            </div>
            <input value={preguntaTirada} onChange={(e) => setPreguntaTirada(e.target.value)} placeholder={t('chat.whatToAsk')}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-3" />

            {cartasSeleccionadas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {cartasSeleccionadas.map((c) => (
                  <div key={c.nombre_carta} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs">
                    <span className="font-medium text-indigo-700">#{c.posicion}</span>
                    <span className={c.es_invertida ? 'text-red-500' : 'text-gray-700'}>{c.nombre_carta}</span>
                    <button onClick={() => toggleInvertida(c.nombre_carta)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${c.es_invertida ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}
                    >{c.es_invertida ? 'Inv' : 'Rec'}</button>
                    <button onClick={() => toggleCarta(c.nombre_carta)} className="text-red-400 hover:text-red-600 ml-0.5">&times;</button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative mb-3">
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={t('chat.searchCard')}
                className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            </div>

            {busqueda.trim() && (
              <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-xl p-2 mb-3">
                {cartasDisponibles.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase())).map((c) => {
                  const yaSel = cartasSeleccionadas.some((cs) => cs.nombre_carta === c.nombre)
                  return (
                    <div key={c.nombre} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-800">{c.nombre}</span>
                        <span className="text-[10px] text-gray-400 ml-2">{c.arcano === 'mayor' ? 'Mayor' : c.palo}</span>
                      </div>
                      <button onClick={() => toggleCarta(c.nombre)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium ${yaSel ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >{yaSel ? 'Quitar' : 'Agregar'}</button>
                    </div>
                  )
                })}
                {cartasDisponibles.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase())).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">{t('chat.noResults')}</p>
                )}
              </div>
            )}

            <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-xl p-2 mb-4">
              <p className="text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">{t('chat.majorArcana')}</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 mb-2">
                {cartasDisponibles.filter((c) => c.arcano === 'mayor').map((c) => (
                  <button key={c.nombre} onClick={() => toggleCarta(c.nombre)}
                    className={`text-[10px] p-1.5 rounded-lg border text-center transition-colors ${cartasSeleccionadas.find((cs) => cs.nombre_carta === c.nombre) ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'hover:bg-gray-50 border-gray-200 text-gray-600'}`}
                  >{c.nombre}</button>
                ))}
              </div>
              {['bastos', 'copas', 'espadas', 'oros'].map((palo) => (
                <div key={palo} className="mb-1.5">
                  <p className="text-[10px] font-medium text-gray-400 mb-1 capitalize">{palo}</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                    {cartasDisponibles.filter((c) => c.palo === palo).map((c) => (
                      <button key={c.nombre} onClick={() => toggleCarta(c.nombre)}
                        className={`text-[10px] p-1.5 rounded-lg border text-center transition-colors ${cartasSeleccionadas.find((cs) => cs.nombre_carta === c.nombre) ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'hover:bg-gray-50 border-gray-200 text-gray-600'}`}
                      >{c.nombre}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={guardarTiradaModal} disabled={cartasSeleccionadas.length === 0 || interpretando}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >{interpretando ? t('chat.interpretando') : t('chat.saveAndInterpret')}</button>
              <button onClick={() => setShowTiradaModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-4">{t('chat.newConsultant')}</h3>
            <form onSubmit={createChat} className="space-y-3">
              <input placeholder={t('chat.name')} value={nombre} onChange={(e) => setNombre(e.target.value)} required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              <input type="date" placeholder={t('chat.birthDate')} value={fechaNac} onChange={(e) => setFechaNac(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              <textarea placeholder={t('chat.reason')} value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" />
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium">{t('chat.startChat')}</button>
                <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium">{t('app.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
