import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

interface Pago {
  id: string
  consultante_id: string
  consultante: { nombre: string } | null
  sesion_id: string | null
  monto: number
  moneda: string
  concepto: string
  fecha_pago: string
  metodo_pago: string
  notas: string | null
  created_at: string
}

interface ConsultanteOption {
  id: string
  nombre: string
}

export default function Pagos() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [consultantes, setConsultantes] = useState<ConsultanteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [consultanteId, setConsultanteId] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState('ARS')
  const [concepto, setConcepto] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [notas, setNotas] = useState('')
  const [resumen, setResumen] = useState({ total: 0, cantidad: 0 })

  const load = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user?.email) return
      const { data: t } = await supabase.from('tarotista').select('id').eq('email', user.user.email).single()
      if (!t) return
      const { data: c } = await supabase.from('consultante').select('id, nombre').eq('tarotista_id', t.id).order('nombre')
      setConsultantes(c || [])

      const [p, r] = await Promise.all([
        api('/api/pagos'),
        api('/api/pagos/stats/resumen'),
      ])
      setPagos(p)
      setResumen(r)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!consultanteId || !monto || !concepto) return
    const body = {
      consultante_id: consultanteId,
      monto: parseFloat(monto),
      moneda,
      concepto,
      metodo_pago: metodoPago,
      notas: notas || null,
      ...(editId ? {} : {}),
    }
    if (editId) {
      await api(`/api/pagos/${editId}`, { method: 'PATCH', body: JSON.stringify(body) })
    } else {
      await api('/api/pagos', { method: 'POST', body: JSON.stringify(body) })
    }
    resetForm()
    load()
  }

  const resetForm = () => {
    setConsultanteId(''); setMonto(''); setMoneda('ARS'); setConcepto('')
    setMetodoPago('efectivo'); setNotas(''); setEditId(null); setShowForm(false)
  }

  const edit = (p: Pago) => {
    setConsultanteId(p.consultante_id)
    setMonto(p.monto.toString())
    setMoneda(p.moneda)
    setConcepto(p.concepto)
    setMetodoPago(p.metodo_pago)
    setNotas(p.notas || '')
    setEditId(p.id)
    setShowForm(true)
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este pago?')) return
    await api(`/api/pagos/${id}`, { method: 'DELETE' })
    load()
  }

  const formatoMoneda = (monto: number, moneda: string) => {
    return `${moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : '$'}${monto.toLocaleString()}`
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pagos</h2>
          <p className="text-sm text-gray-500 mt-1">
            {resumen.cantidad} pagos · Total: {formatoMoneda(resumen.total, 'ARS')}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >+ Nuevo pago</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editId ? 'Editar' : 'Nuevo'} pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Consultante *</label>
              <select value={consultanteId} onChange={(e) => setConsultanteId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                <option value="">Seleccionar...</option>
                {consultantes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monto *</label>
              <div className="flex gap-2">
                <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="0.00" />
                <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Método de pago</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input placeholder="Concepto *" value={concepto} onChange={(e) => setConcepto(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            <input placeholder="Notas (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          </div>
          <div className="flex gap-3">
            <button onClick={save}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >{editId ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        {pagos.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">No hay pagos registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="p-4">Fecha</th>
                <th className="p-4">Consultante</th>
                <th className="p-4">Concepto</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Método</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 text-gray-500 text-xs">{new Date(p.fecha_pago).toLocaleDateString()}</td>
                  <td className="p-4 font-medium">{p.consultante?.nombre || '—'}</td>
                  <td className="p-4 text-gray-600">{p.concepto}</td>
                  <td className="p-4 font-semibold text-gray-800">{formatoMoneda(p.monto, p.moneda)}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium capitalize">
                      {p.metodo_pago.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => edit(p)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Editar</button>
                    <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
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
