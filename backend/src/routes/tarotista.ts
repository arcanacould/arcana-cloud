import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

const createSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().optional(),
  plan: z.enum(['S', 'M', 'L']).default('S'),
})

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from('tarotista').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('tarotista').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'No encontrado' })
  res.json(data)
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase.from('tarotista').insert(parsed.data).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  telefono: z.string().optional(),
  plan: z.enum(['S', 'M', 'L']).optional(),
  suscripcion_activa: z.boolean().optional(),
  foto_url: z.string().optional().nullable(),
  descripcion_breve: z.string().optional().nullable(),
})

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase.from('tarotista').update(parsed.data).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
