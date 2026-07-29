import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

interface Consultante {
  id: string
  tarotista_id: string
  nombre: string
  email: string | null
  telefono: string | null
  notas: string | null
  etiquetas: string[] | null
  fecha_nacimiento: string | null
  motivo: string | null
  created_at: string
}

export default function Consultantes() {
  const [consultantes, setConsultantes] = useState<Consultante[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [etiquetasStr, setEtiquetasStr] = useState('')
  const [tarotistaId, setTarotistaId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sesionCounts, setSesionCounts] = useState<Record<string, number>>({})

  const load = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user?.email) return
    const { data: t } = await supabase.from('tarotista').select('id').eq('email', user.user.email).single()
    if (!t) return
    setTarotistaId(t.id)
    const { data } = await supabase
      .from('consultante')
      .select('*')
      .eq('tarotista_id', t.id)
      .order('created_at', { ascending: false })
    setConsultantes(data || [])

    const { data: sesiones } = await supabase
      .from('sesion')
      .select('consultante_id')
      .eq('tarotista_id', t.id)
    if (sesiones) {
      const counts: Record<string, number> = {}
      sesiones.forEach((s) => { counts[s.consultante_id] = (counts[s.consultante_id] || 0) + 1 })
      setSesionCounts(counts)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!nombre.trim()) return
    const etiquetas = etiquetasStr.split(',').map((e) => e.trim()).filter(Boolean)
    const payload = { nombre, email, telefono, notas, etiquetas }
    if (editId) {
      await supabase.from('consultante').update(payload).eq('id', editId)
    } else {
      await supabase.from('consultante').insert({ ...payload, tarotista_id: tarotistaId })
    }
    setNombre(''); setEmail(''); setTelefono(''); setNotas(''); setEtiquetasStr('')
    setEditId(null); setShowForm(false)
    load()
  }

  const edit = (c: Consultante) => {
    setNombre(c.nombre)
    setEmail(c.email || '')
    setTelefono(c.telefono || '')
    setNotas(c.notas || '')
    setEtiquetasStr((c.etiquetas || []).join(', '))
    setEditId(c.id)
    setShowForm(true)
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar consultante?')) return
    await supabase.from('consultante').delete().eq('id', id)
    load()
  }

  const filtered = consultantes.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.telefono || '').includes(q) ||
      (c.notas || '').toLowerCase().includes(q) ||
      (c.etiquetas || []).some((e) => e.toLowerCase().includes(q))
    )
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Consultantes</h2>
        <div className="flex gap-3 items-center">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, etiqueta..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-64"
          />
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setNombre(''); setEmail(''); setTelefono(''); setNotas(''); setEtiquetasStr('') }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >+ Nuevo</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editId ? 'Editar' : 'Nuevo'} consultante</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input placeholder="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input placeholder="Etiquetas (separadas por coma)" value={etiquetasStr} onChange={(e) => setEtiquetasStr(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="mb-4">
            <textarea placeholder="Notas internas sobre el consultante..." value={notas} onChange={(e) => setNotas(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
              rows={3} />
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Guardar</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        {filtered.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">{search ? 'Sin resultados para esa búsqueda' : 'No hay consultantes registrados'}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="p-4">Nombre</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Etiquetas</th>
                <th className="p-4">Sesiones</th>
                <th className="p-4">Notas</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium">{c.nombre}</td>
                  <td className="p-4 text-gray-500">
                    {c.email && <span className="block text-xs">{c.email}</span>}
                    {c.telefono && <span className="block text-xs">{c.telefono}</span>}
                    {!c.email && !c.telefono && <span className="text-xs">—</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {(c.etiquetas || []).length === 0 ? (
                        <span className="text-gray-400 text-xs">—</span>
                      ) : (
                        (c.etiquetas || []).map((e) => (
                          <span key={e} className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-medium">
                            {e}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-gray-700">{sesionCounts[c.id] || 0}</span>
                  </td>
                  <td className="p-4 max-w-[200px]">
                    <span className="text-gray-400 text-xs truncate block">{c.notas || '—'}</span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => edit(c)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Editar</button>
                    <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
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
