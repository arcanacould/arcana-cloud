import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    tarotista_id: z.string().uuid(),
    consultante_id: z.string().uuid().optional().nullable(),
    puntuacion: z.number().min(0).max(5),
    comentario: z.string().optional().nullable(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase
    .from('valoracion')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.get('/:tarotistaId', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('valoracion')
    .select('*')
    .eq('tarotista_id', req.params.tarotistaId)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

router.get('/:tarotistaId/promedio', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('valoracion')
    .select('puntuacion')
    .eq('tarotista_id', req.params.tarotistaId)

  if (error) return res.status(500).json({ error: error.message })

  const ratings = data || []
  const promedio = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + Number(r.puntuacion), 0) / ratings.length
    : 0

  res.json({ promedio: Math.round(promedio * 10) / 10, cantidad: ratings.length })
})

export default router
