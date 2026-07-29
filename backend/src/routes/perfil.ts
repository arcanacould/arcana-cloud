import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

const updateSchema = z.object({
  nombre_persona: z.string().min(1),
  tono: z.string().min(1),
  frases_caracteristicas: z.string().optional(),
  estilo_cierre: z.string().optional(),
  motor_ia: z.enum(['gemini', 'openai', 'deepseek']).optional(),
  prompt_personalizado: z.string().optional(),
})

async function puedeUsarMotorAvanzado(tarotistaId: string): Promise<boolean> {
  const { data: tarotista } = await supabase.from('tarotista').select('plan, email').eq('id', tarotistaId).single()
  if (!tarotista) return false
  if (tarotista.plan === 'L') return true
  const { data: usuario } = await supabase.from('usuario').select('rol').eq('email', tarotista.email).single()
  if (usuario?.rol === 'admin') return true
  return false
}

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const tarotistaId = req.user!.tarotistaId
  if (!tarotistaId) return res.status(403).json({ error: 'Tarotista no identificado' })
  const { data, error } = await supabase
    .from('perfil_persona')
    .select('*')
    .eq('tarotista_id', tarotistaId)
    .eq('activa', true)
    .single()
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
  const puedeAvanzado = await puedeUsarMotorAvanzado(tarotistaId)
  res.json({ ...(data || { motor_ia: 'gemini' }), motor_ia: data?.motor_ia || 'gemini', puede_avanzado: puedeAvanzado })
})

router.put('/', requireAuth, async (req: Request, res: Response) => {
  const tarotistaId = req.user!.tarotistaId
  if (!tarotistaId) return res.status(403).json({ error: 'Tarotista no identificado' })
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const puedeAvanzado = await puedeUsarMotorAvanzado(tarotistaId)
  const body: any = { ...parsed.data }
  if (!puedeAvanzado) {
    delete body.motor_ia
    delete body.prompt_personalizado
  }

  const { data: existing } = await supabase
    .from('perfil_persona')
    .select('id')
    .eq('tarotista_id', tarotistaId)
    .eq('activa', true)
    .single()

  if (existing) {
    const campos = { ...body }
    if (!puedeAvanzado) { delete campos.motor_ia; delete campos.prompt_personalizado }
    const { data, error } = await supabase
      .from('perfil_persona')
      .update(campos)
      .eq('id', existing.id)
      .select()
      .single()
    if (error?.message?.includes('column')) {
      const base = { nombre_persona: campos.nombre_persona, tono: campos.tono, frases_caracteristicas: campos.frases_caracteristicas, estilo_cierre: campos.estilo_cierre }
      const { data: d2, error: e2 } = await supabase.from('perfil_persona').update(base).eq('id', existing.id).select().single()
      if (e2) return res.status(500).json({ error: e2.message })
      return res.json(d2)
    }
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  const insertData = { tarotista_id: tarotistaId, version: 1, activa: true, ...body }
  const { data, error } = await supabase
    .from('perfil_persona')
    .insert(insertData)
    .select()
    .single()
  if (error?.message?.includes('column')) {
    const base = { tarotista_id: tarotistaId, version: 1, activa: true, nombre_persona: body.nombre_persona, tono: body.tono, frases_caracteristicas: body.frases_caracteristicas, estilo_cierre: body.estilo_cierre }
    const { data: d2, error: e2 } = await supabase.from('perfil_persona').insert(base).select().single()
    if (e2) return res.status(500).json({ error: e2.message })
    return res.status(201).json(d2)
  }
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

export default router
