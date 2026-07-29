import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'
import { checkPlanLimit } from '../middleware/plan'

const router = Router()

const createSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  notas: z.string().optional(),
})

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('consultante')
    .select('*')
    .eq('tarotista_id', req.user!.tarotistaId)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('consultante')
    .select('*')
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
    .single()
  if (error) return res.status(404).json({ error: 'No encontrado' })
  res.json(data)
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const limitError = await checkPlanLimit(req.user!.tarotistaId, 'consultante')
  if (limitError) return res.status(403).json({ error: limitError })

  const { data, error } = await supabase
    .from('consultante')
    .insert({ ...parsed.data, tarotista_id: req.user!.tarotistaId })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  notas: z.string().optional(),
})

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase
    .from('consultante')
    .update(parsed.data)
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('consultante')
    .delete()
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
