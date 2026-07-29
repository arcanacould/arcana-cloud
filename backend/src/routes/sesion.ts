import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'
import { checkPlanLimit } from '../middleware/plan'

const router = Router()

const createSchema = z.object({
  consultante_id: z.string().uuid(),
})

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('sesion')
    .select('*, consultante(nombre, email)')
    .eq('tarotista_id', req.user!.tarotistaId)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('sesion')
    .select('*, consultante(*), tirada(*, carta(*, interpretacion(*)))')
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
    .single()
  if (error) return res.status(404).json({ error: 'No encontrada' })
  res.json(data)
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const limitError = await checkPlanLimit(req.user!.tarotistaId, 'sesion')
  if (limitError) return res.status(403).json({ error: limitError })

  const { data, error } = await supabase
    .from('sesion')
    .insert({ consultante_id: parsed.data.consultante_id, tarotista_id: req.user!.tarotistaId })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id/estado', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({ estado: z.enum(['activa', 'completada', 'cancelada']) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const updates: Record<string, string> = { estado: parsed.data.estado }
  if (parsed.data.estado === 'completada') updates.fecha_fin = new Date().toISOString()

  const { data, error } = await supabase
    .from('sesion')
    .update(updates)
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
