import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  const tarotistaId = req.user!.tarotistaId

  const { count: consultantes } = await supabase
    .from('consultante').select('*', { count: 'exact', head: true }).eq('tarotista_id', tarotistaId)
  const { count: sesiones } = await supabase
    .from('sesion').select('*', { count: 'exact', head: true }).eq('tarotista_id', tarotistaId)
  const { count: activas } = await supabase
    .from('sesion').select('*', { count: 'exact', head: true }).eq('tarotista_id', tarotistaId).eq('estado', 'activa')
  const { count: tiradas } = await supabase
    .from('tirada').select('*', { count: 'exact', head: true }).eq('tarotista_id', tarotistaId)

  const { data: todasSesiones } = await supabase
    .from('sesion').select('created_at, estado').eq('tarotista_id', tarotistaId).order('created_at', { ascending: false })

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  }).reverse()

  const sesionesPorDia = ultimos7.map((fecha) => ({
    fecha,
    count: todasSesiones?.filter((s) => s.created_at?.slice(0, 10) === fecha).length || 0,
  }))

  const ultimos6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }).reverse()

  const consultantesPorMes = ultimos6.map((mes) => ({
    mes,
    count: todasSesiones?.filter((s) => s.created_at?.slice(0, 7) === mes).length || 0,
  }))

  const { data: tiradasPorTipo } = await supabase
    .from('tirada').select('tipo').eq('tarotista_id', tarotistaId)

  const tipoCount: Record<string, number> = {}
  tiradasPorTipo?.forEach((t: any) => { tipoCount[t.tipo] = (tipoCount[t.tipo] || 0) + 1 })

  const { count: consultantesEsteMes } = await supabase
    .from('consultante').select('*', { count: 'exact', head: true })
    .eq('tarotista_id', tarotistaId)
    .gte('created_at', new Date(new Date().setDate(1)).toISOString())

  res.json({
    consultantes: consultantes || 0,
    sesiones: sesiones || 0,
    activas: activas || 0,
    tiradas: tiradas || 0,
    consultantesEsteMes: consultantesEsteMes || 0,
    sesionesPorDia,
    consultantesPorMes,
    tiradasPorTipo: Object.entries(tipoCount).map(([tipo, count]) => ({ tipo, count })),
  })
})

export default router
