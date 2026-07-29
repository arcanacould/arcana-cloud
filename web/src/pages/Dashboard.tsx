import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { useI18n } from '../lib/i18n'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 hover:border-gray-200 transition-colors">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center text-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<any>(null)
  const [recentSesiones, setRecentSesiones] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user?.email) return
      const { data: tarotista } = await supabase.from('tarotista').select('id').eq('email', user.user.email).single()
      if (!tarotista) return

      try { setStats(await api('/api/stats/dashboard')) } catch { /* ignore */ }

      const { data: ses } = await supabase
        .from('sesion').select('*, consultante(nombre)').eq('tarotista_id', tarotista.id)
        .order('created_at', { ascending: false }).limit(5)
      setRecentSesiones(ses || [])
    }
    load()
  }, [])

  const cards = [
    { label: t('dashboard.consultants'), value: stats?.consultantes ?? '—', sub: `${stats?.consultantesEsteMes ?? 0} ${t('dashboard.thisMonth')}`, color: 'bg-indigo-500', icon: '👥' },
    { label: t('dashboard.totalSessions'), value: stats?.sesiones ?? '—', sub: `${stats?.activas ?? 0} ${t('dashboard.active')}`, color: 'bg-purple-500', icon: '📋' },
    { label: t('dashboard.totalReadings'), value: stats?.tiradas ?? '—', sub: t('dashboard.withAI'), color: 'bg-amber-500', icon: '🃏' },
    { label: t('dashboard.activeSessions'), value: stats?.activas ?? '—', sub: t('dashboard.inProgress'), color: 'bg-green-500', icon: '🟢' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('dashboard.title')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('dashboard.sessions7days')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.sesionesPorDia}>
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('dashboard.readingsByType')}</h3>
            {stats.tiradasPorTipo.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">{t('app.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.tiradasPorTipo} dataKey="count" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => `${entry.tipo}: ${entry.count}`}>
                    {stats.tiradasPorTipo.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('dashboard.sessionsByMonth')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.consultantesPorMes}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">{t('dashboard.recentSessions')}</h3>
          <button onClick={() => navigate('/sesiones')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">{t('app.viewAll')}</button>
        </div>
        {recentSesiones.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">{t('dashboard.noSessions')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">{t('dashboard.consultant')}</th>
                <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">{t('dashboard.status')}</th>
                <th className="pb-3 font-medium text-[11px] uppercase tracking-wider">{t('dashboard.startDate')}</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {recentSesiones.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 text-sm font-medium text-gray-800">{s.consultante?.nombre || '—'}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                      s.estado === 'activa' ? 'bg-green-50 text-green-700' :
                      s.estado === 'completada' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
                    }`}>{s.estado}</span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">{new Date(s.fecha_inicio).toLocaleDateString()}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => navigate(`/sesiones/${s.id}`)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Ver</button>
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
