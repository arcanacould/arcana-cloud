import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function SesionReport() {
  const { id } = useParams()
  const [sesion, setSesion] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api(`/api/sesiones/${id}`).then(setSesion).catch(() => {}).finally(() => setLoading(false)) }, [id])
  useEffect(() => { if (!loading && sesion) setTimeout(() => window.print(), 500) }, [loading, sesion])

  if (loading) return <p className="text-center p-8 text-sm text-gray-500">Cargando...</p>
  if (!sesion) return <p className="text-center p-8 text-sm text-red-500">Sesión no encontrada</p>

  return (
    <div className="max-w-3xl mx-auto p-8 print:p-4">
      <div className="text-center mb-8 print:mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🔮 Arcana Cloud</h1>
        <p className="text-xs text-gray-500 mt-0.5">Reporte de sesión</p>
      </div>

      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{sesion.consultante?.nombre || 'Consultante'}</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(sesion.fecha_inicio).toLocaleString()}
          {sesion.fecha_fin && ` — ${new Date(sesion.fecha_fin).toLocaleString()}`}
        </p>
        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-md text-xs font-medium ${
          sesion.estado === 'activa' ? 'bg-green-50 text-green-700' :
          sesion.estado === 'completada' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
        }`}>{sesion.estado}</span>
      </div>

      {sesion.tirada?.map((t: any) => (
        <div key={t.id} className="mb-8 print:mb-6 break-inside-avoid">
          <h3 className="text-sm font-semibold text-indigo-700 capitalize mb-1">
            {t.tipo === 'tres' ? 'Tirada de 3 cartas' : t.tipo === 'cruz' ? 'Cruz Celta' : t.tipo === 'si-no' ? 'Sí / No' : t.tipo}
          </h3>
          {t.pregunta && <p className="text-xs text-gray-600 italic mb-3">"{t.pregunta}"</p>}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {t.carta?.map((c: any) => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-3 text-center bg-gray-50">
                <p className="text-xs text-gray-400 mb-1">#{c.posicion}</p>
                <p className={`text-sm font-medium ${c.es_invertida ? 'text-red-500' : 'text-gray-800'}`}>{c.nombre_carta}</p>
                {c.es_invertida && <p className="text-[10px] text-red-400">Invertida</p>}
              </div>
            ))}
          </div>

          {t.carta?.some((c: any) => c.interpretacion?.length > 0) && (
            <div className="space-y-2">
              {t.carta.map((c: any) => c.interpretacion?.map((i: any) => (
                <div key={i.id} className="bg-indigo-50/50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed border border-indigo-100/50">
                  <p className="font-semibold text-indigo-700 mb-1">{c.nombre_carta}</p>
                  {i.contenido}
                </div>
              )))}
            </div>
          )}
        </div>
      ))}

      <div className="text-center text-[10px] text-gray-400 mt-8 pt-4 border-t border-gray-200 print:mt-4">
        Generado por Arcana Cloud · {new Date().toLocaleDateString()}
      </div>
    </div>
  )
}
