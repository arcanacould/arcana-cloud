import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('ake_carta')
    .select('*')
    .order('numero', { ascending: true, nullsFirst: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/arcanos-mayores', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('ake_carta')
    .select('*')
    .eq('arcano', 'mayor')
    .order('numero', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/arcanos-menores', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('ake_carta')
    .select('*')
    .eq('arcano', 'menor')
    .order('palo', { ascending: true })
    .order('numero', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:nombre', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('ake_carta')
    .select('*')
    .ilike('nombre', req.params.nombre as string)
    .single()
  if (error) return res.status(404).json({ error: 'Carta no encontrada' })
  res.json(data)
})

export default router
