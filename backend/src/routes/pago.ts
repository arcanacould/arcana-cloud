import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

const createSchema = z.object({
  consultante_id: z.string().uuid(),
  sesion_id: z.string().uuid().optional().nullable(),
  monto: z.number().positive(),
  moneda: z.enum(['ARS', 'USD', 'EUR']).default('ARS'),
  concepto: z.string().min(1),
  fecha_pago: z.string().optional(),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'mercado_pago', 'otro']).default('efectivo'),
  notas: z.string().optional().nullable(),
})

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('pago')
    .select('*, consultante(nombre)')
    .eq('tarotista_id', req.user!.tarotistaId)
    .order('fecha_pago', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('pago')
    .select('*, consultante(nombre)')
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
    .single()
  if (error) return res.status(404).json({ error: 'No encontrado' })
  res.json(data)
})

router.get('/por-consultante/:consultanteId', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('pago')
    .select('*')
    .eq('tarotista_id', req.user!.tarotistaId)
    .eq('consultante_id', req.params.consultanteId)
    .order('fecha_pago', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/stats/resumen', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('pago')
    .select('monto')
    .eq('tarotista_id', req.user!.tarotistaId)
  if (error) return res.status(500).json({ error: error.message })

  const total = data?.reduce((sum, p) => sum + Number(p.monto), 0) || 0
  const cantidad = data?.length || 0
  res.json({ total, cantidad })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const payload = {
    tarotista_id: req.user!.tarotistaId,
    consultante_id: parsed.data.consultante_id,
    sesion_id: parsed.data.sesion_id || null,
    monto: parsed.data.monto,
    moneda: parsed.data.moneda,
    concepto: parsed.data.concepto,
    fecha_pago: parsed.data.fecha_pago || new Date().toISOString().split('T')[0],
    metodo_pago: parsed.data.metodo_pago,
    notas: parsed.data.notas || null,
  }

  const { data, error } = await supabase
    .from('pago')
    .insert(payload)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

const updateSchema = z.object({
  monto: z.number().positive().optional(),
  moneda: z.enum(['ARS', 'USD', 'EUR']).optional(),
  concepto: z.string().min(1).optional(),
  fecha_pago: z.string().optional(),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'mercado_pago', 'otro']).optional(),
  notas: z.string().optional().nullable(),
})

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase
    .from('pago')
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
    .from('pago')
    .delete()
    .eq('id', req.params.id)
    .eq('tarotista_id', req.user!.tarotistaId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
