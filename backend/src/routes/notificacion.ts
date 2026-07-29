import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('notificacion')
    .select('*')
    .eq('tarotista_id', req.user!.tarotistaId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/no-leidas', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('notificacion')
    .select('*', { count: 'exact', head: true })
    .eq('tarotista_id', req.user!.tarotistaId)
    .eq('leida', false)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ count: data?.length || 0 })
})

const createSchema = z.object({
  tipo: z.enum(['info', 'exito', 'alerta', 'pago', 'sesion']),
  titulo: z.string().min(1),
  mensaje: z.string().min(1),
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase
    .from('notificacion')
    .insert({ ...parsed.data, tarotista_id: req.user!.tarotistaId })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

const marcarLeidaSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})

router.patch('/marcar-leidas', requireAuth, async (req: Request, res: Response) => {
  const parsed = marcarLeidaSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { error } = await supabase
    .from('notificacion')
    .update({ leida: true })
    .eq('tarotista_id', req.user!.tarotistaId)
    .in('id', parsed.data.ids)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

router.patch('/:id/leer', requireAuth, async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('notificacion')
    .update({ leida: true })
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('notificacion')
    .delete()
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
