import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'
import { checkPlanLimit } from '../middleware/plan'
import { generarChatRespuesta, generarInterpretacionTirada } from '../services/ai'

const router = Router()

const startSchema = z.object({ nombre: z.string().min(1), fecha_nacimiento: z.string().optional(), motivo: z.string().optional() })
const mensajeSchema = z.object({ contenido: z.string().min(1), tipo: z.enum(['cliente', 'tarotista']) })

async function crearConsultante(tarotistaId: string, data: { nombre: string; notas?: string; fecha_nacimiento?: string; motivo?: string }) {
  const full = { tarotista_id: tarotistaId, nombre: data.nombre, notas: data.notas || null, fecha_nacimiento: data.fecha_nacimiento || null, motivo: data.motivo || null }
  const { data: c, error } = await supabase.from('consultante').insert(full).select().single()
  if (error?.message?.includes('column') && (data.fecha_nacimiento || data.motivo)) {
    const base = { tarotista_id: tarotistaId, nombre: data.nombre, notas: data.notas || null }
    const { data: c2, error: e2 } = await supabase.from('consultante').insert(base).select().single()
    if (e2) throw e2; return c2
  }
  if (error) throw error; return c
}

async function parseCartas(contenido: string): Promise<{ nombre: string; es_invertida: boolean }[]> {
  const { data: cartas } = await supabase.from('ake_carta').select('nombre')
  if (!cartas) return []
  const texto = contenido.toLowerCase()
  return cartas.filter((c: any) => texto.includes(c.nombre.toLowerCase())).map((c: any) => ({
    nombre: c.nombre,
    es_invertida: texto.includes(`${c.nombre.toLowerCase()} (inv)`),
  }))
}

router.post('/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = startSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const tarotistaId = req.user!.tarotistaId
    if (!tarotistaId) return res.status(403).json({ error: 'Tarotista no identificado' })
    const limitError = await checkPlanLimit(tarotistaId, 'consultante')
    if (limitError) return res.status(403).json({ error: limitError })
    const consultante = await crearConsultante(tarotistaId, {
      nombre: parsed.data.nombre, notas: parsed.data.motivo || undefined,
      fecha_nacimiento: parsed.data.fecha_nacimiento || undefined, motivo: parsed.data.motivo || undefined,
    })
    const { data: sesion, error: sErr } = await supabase
      .from('sesion').insert({ tarotista_id: tarotistaId, consultante_id: consultante.id }).select().single()
    if (sErr) return res.status(500).json({ error: sErr.message })
    res.status(201).json({ consultante, sesion })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const tarotistaId = req.user!.tarotistaId
    if (!tarotistaId) return res.status(403).json({ error: 'Tarotista no identificado' })
    const { data, error } = await supabase
      .from('consultante')
      .select('*, sesion(id, created_at, estado, tirada(id, created_at, tipo, pregunta)), memoria(contenido, created_at, tipo)')
      .eq('tarotista_id', tarotistaId).order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    const chats = (data || []).map((c: any) => {
      const sesiones = c.sesion || []
      const ultimaSesion = sesiones.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      const tiradas = ultimaSesion?.tirada || []
      const ultimaTirada = tiradas.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      const memorias = (c.memoria || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const ultimaMemoria = memorias[0]
      const msgTirada = ultimaTirada?.pregunta
      const esIa = ultimaMemoria?.tipo === 'respuesta_ia' || ultimaMemoria?.tipo === 'evento'
      const msgMemoria = esIa ? '🔮 IA respondió' : ultimaMemoria?.contenido
      const ultimoMensaje = msgTirada || msgMemoria || 'Sin actividad'
      const fechaSesion = ultimaSesion?.created_at
      const fechaMemoria = ultimaMemoria?.created_at
      const ultimaActividad = [fechaSesion, fechaMemoria, c.created_at].filter(Boolean).sort().reverse()[0]
      return { id: c.id, nombre: c.nombre, ultimo_mensaje: ultimoMensaje, ultima_actividad: ultimaActividad, fecha_nacimiento: c.fecha_nacimiento, motivo: c.motivo }
    })
    res.json(chats)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const tarotistaId = req.user!.tarotistaId
    if (!tarotistaId) return res.status(403).json({ error: 'Tarotista no identificado' })
    const { data: consultante, error: cErr } = await supabase
      .from('consultante').select('*').eq('id', req.params.id).eq('tarotista_id', tarotistaId).single()
    if (cErr) return res.status(404).json({ error: 'Consultante no encontrado' })

    const { data: sesiones } = await supabase
      .from('sesion').select('*, tirada(*, carta(*, interpretacion(*)))')
      .eq('consultante_id', consultante.id).eq('tarotista_id', tarotistaId)
      .order('created_at', { ascending: true })

    const { data: memorias } = await supabase
      .from('memoria').select('*').eq('consultante_id', consultante.id).eq('tarotista_id', tarotistaId).eq('activa', true).order('created_at', { ascending: true })

    const mensajes: any[] = []
    for (const m of memorias || []) {
      const tipo = (m.tipo === 'respuesta_ia' || m.tipo === 'evento') ? 'ia_respuesta' : 'contexto'
      mensajes.push({ id: `mem-${m.id}`, tipo, contenido: m.contenido, created_at: m.created_at, origen: m.tipo })
    }
    for (const s of sesiones || []) {
      for (const t of s.tirada || []) {
        if (t.pregunta) mensajes.push({ id: `preg-${t.id}`, tipo: 'tirada_pregunta', contenido: t.pregunta, created_at: t.created_at })
        mensajes.push({ id: `tirada-${t.id}`, tipo: 'tirada_respuesta', contenido: t, created_at: t.created_at })
      }
    }
    mensajes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    res.json({ consultante, mensajes })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.post('/:id/mensaje', requireAuth, async (req: Request, res: Response) => {
  try {
    const tarotistaId = req.user!.tarotistaId
    if (!tarotistaId) return res.status(403).json({ error: 'Tarotista no identificado' })

    const parsed = mensajeSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const { data: consultante } = await supabase
      .from('consultante').select('*').eq('id', req.params.id).eq('tarotista_id', tarotistaId).single()
    if (!consultante) return res.status(404).json({ error: 'Consultante no encontrado' })

    const { contenido, tipo } = parsed.data
    const cartasEncontradas = await parseCartas(contenido)

    if (cartasEncontradas.length > 0) {
      const { data: sesionActiva } = await supabase
        .from('sesion').select('id').eq('consultante_id', consultante.id).eq('tarotista_id', tarotistaId).eq('estado', 'activa').limit(1).maybeSingle()
      let sesionId = sesionActiva?.id
      if (!sesionId) {
        const { data: ns } = await supabase
          .from('sesion').insert({ tarotista_id: tarotistaId, consultante_id: consultante.id }).select().single()
        sesionId = ns?.id
      }

      const { data: tirada } = await supabase
        .from('tirada').insert({ sesion_id: sesionId, tarotista_id: tarotistaId, tipo: 'manual', pregunta: contenido }).select().single()

      const cartasInsert = cartasEncontradas.map((c, i) => ({
        tirada_id: tirada.id, tarotista_id: tarotistaId, nombre_carta: c.nombre, posicion: i + 1, es_invertida: c.es_invertida,
      }))
      await supabase.from('carta').insert(cartasInsert)

      const { data: cartasDb } = await supabase.from('carta').select('*, interpretacion(*)').eq('tirada_id', tirada.id)

      const { texto: iaTexto } = await generarInterpretacionTirada(
        tarotistaId, consultante.nombre, [contenido],
        cartasEncontradas.map((c, i) => ({ nombre_carta: c.nombre, es_invertida: c.es_invertida, posicion: i + 1 })),
      )

      for (const c of cartasDb || []) {
        await supabase.from('interpretacion').insert({ carta_id: c.id, tarotista_id: tarotistaId, contenido: iaTexto, creado_por: 'sistema' })
      }

      const { error: memErr } = await supabase.from('memoria').insert({
        consultante_id: consultante.id, tarotista_id: tarotistaId,
        tipo: 'evento', contenido: iaTexto, sesion_origen_id: null, activa: true,
      })
      if (memErr) console.error('memoria insert error (tirada):', memErr)

      return res.json({ tipo: 'tirada_respuesta', cartas: cartasEncontradas, interpretacion_conjunta: iaTexto })
    }

    await supabase.from('memoria').insert({
      consultante_id: consultante.id, tarotista_id: tarotistaId,
      tipo: tipo === 'cliente' ? 'creencia' : 'situacion',
      contenido, sesion_origen_id: null, activa: true,
    })

    const { data: memorias } = await supabase
      .from('memoria').select('contenido').eq('consultante_id', consultante.id).eq('tarotista_id', tarotistaId).eq('activa', true)
    const { data: sesionesParaTiradas } = await supabase
      .from('sesion').select('id').eq('consultante_id', consultante.id).eq('tarotista_id', tarotistaId)
    const sesionIds = (sesionesParaTiradas || []).map((s: any) => s.id)
    const { data: tiradas } = sesionIds.length > 0 ? await supabase
      .from('tirada').select('pregunta, carta(nombre_carta, es_invertida)').in('sesion_id', sesionIds).eq('tarotista_id', tarotistaId).order('created_at', { ascending: false }).limit(3) : { data: [] }

    const memoriaTextos = (memorias || []).map((m: any) => m.contenido)
    const ultimasTiradas = (tiradas || []).map((t: any) => `• ${t.pregunta} → ${(t.carta || []).map((c: any) => c.nombre_carta).join(', ')}`)
    const respuesta = await generarChatRespuesta(
      tarotistaId, consultante.nombre, contenido, memoriaTextos, ultimasTiradas,
      consultante.fecha_nacimiento, consultante.motivo,
    )

    const { error: memErr } = await supabase.from('memoria').insert({
      consultante_id: consultante.id, tarotista_id: tarotistaId,
      tipo: 'evento', contenido: respuesta, sesion_origen_id: null, activa: true,
    })
    if (memErr) console.error('memoria insert error:', memErr)

    return res.json({ tipo: 'ia_respuesta', contenido: respuesta })
  } catch (err: any) { console.error('chat POST error:', err); res.status(500).json({ error: err.message }) }
})

router.post('/:id/cerrar', requireAuth, async (req: Request, res: Response) => {
  try {
    const tarotistaId = req.user!.tarotistaId
    if (!tarotistaId) return res.status(403).json({ error: 'Tarotista no identificado' })

    const { data: consultante, error: cErr } = await supabase
      .from('consultante').select('*').eq('id', req.params.id).eq('tarotista_id', tarotistaId).single()
    if (cErr) return res.status(404).json({ error: 'Consultante no encontrado' })

    const { data: sesiones } = await supabase
      .from('sesion').select('*, tirada(*, carta(*))')
      .eq('consultante_id', consultante.id).eq('tarotista_id', tarotistaId)
      .order('created_at', { ascending: true })

    const { data: memorias } = await supabase
      .from('memoria').select('*')
      .eq('consultante_id', consultante.id).eq('tarotista_id', tarotistaId)
      .eq('activa', true).order('created_at', { ascending: true })

    const contextText = (memorias || []).map(m => `• [${m.tipo}] ${m.contenido}`).join('\n')
    const tiradasText = (sesiones || []).flatMap((s: any) => (s.tirada || []).map((t: any) => {
      const cartasStr = (t.carta || []).map((c: any) => `${c.nombre_carta}${c.es_invertida ? ' (inv)' : ''}`).join(', ')
      return `• ${t.pregunta || 'Sin pregunta'} → ${cartasStr}`
    })).join('\n')

    const summary = `Resumen de sesiones con ${consultante.nombre}:\n\nContexto:\n${contextText || 'Sin contexto registrado'}\n\nTiradas realizadas:\n${tiradasText || 'Sin tiradas registradas'}`

    for (const s of (sesiones || []) as any[]) {
      await supabase.from('resumen').insert({ sesion_id: s.id, tarotista_id: tarotistaId, contenido: summary })
    }

    const sesionIds = (sesiones || []).map(s => s.id)
    if (sesionIds.length > 0) {
      await supabase.from('sesion').update({ estado: 'cerrada' }).in('id', sesionIds).eq('tarotista_id', tarotistaId)
    }

    await supabase.from('memoria').update({ activa: false })
      .eq('consultante_id', consultante.id).eq('tarotista_id', tarotistaId).eq('activa', true)

    res.json({ ok: true, message: `Sesiones cerradas para ${consultante.nombre}` })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

export default router
