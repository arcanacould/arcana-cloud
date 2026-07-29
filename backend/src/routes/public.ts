import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase, supabaseAdmin } from '../lib/supabase'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
  telefono: z.string().optional(),
})

router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const { email, password, nombre, telefono } = parsed.data

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) return res.status(400).json({ error: authError.message })
    if (!authData.user) return res.status(500).json({ error: 'Error al crear usuario' })

    const { data: tarotista, error: tError } = await supabase.from('tarotista').insert({
      nombre, email, telefono: telefono || null, plan: 'S', suscripcion_activa: true,
    }).select().single()
    if (tError) {
      try { await supabaseAdmin.auth.admin.deleteUser(authData.user.id) } catch {}
      return res.status(500).json({ error: tError.message })
    }

    const { error: uError } = await supabase.from('usuario').insert({
      tarotista_id: tarotista.id, email, nombre, rol: 'tarotista',
    })
    if (uError) {
      try { await supabaseAdmin.auth.admin.deleteUser(authData.user.id) } catch {}
      await supabase.from('tarotista').delete().eq('id', tarotista.id)
      return res.status(500).json({ error: uError.message })
    }

    res.status(201).json({ id: tarotista.id, message: 'Registro exitoso. Revisa tu email para confirmar.' })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

router.get('/tarotistas', async (_req: Request, res: Response) => {
  try {
    const { data: dataAdmin, error: errorAdmin } = await supabase
      .from('usuario')
      .select('tarotista_id')
      .eq('rol', 'admin')
    if (errorAdmin) return res.status(500).json({ error: errorAdmin.message })

    const adminIds = new Set((dataAdmin || []).map((u) => u.tarotista_id).filter(Boolean))

    const { data, error } = await supabase
      .from('tarotista')
      .select('id, nombre, email, foto_url, descripcion_breve')
      .in('plan', ['M', 'L'])
      .eq('suscripcion_activa', true)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    const filtered = (data || []).filter((t) => !adminIds.has(t.id))

    const tarotistasConRating = await Promise.all(
      filtered.map(async (t) => {
        const { data: ratings } = await supabase
          .from('valoracion')
          .select('puntuacion')
          .eq('tarotista_id', t.id)
        const total = ratings?.reduce((sum, r) => sum + Number(r.puntuacion), 0) || 0
        const count = ratings?.length || 0
        return {
          ...t,
          puntuacion: count > 0 ? Math.round((total / count) * 10) / 10 : null,
          total_valoraciones: count,
        }
      })
    )

    res.json(tarotistasConRating)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

export default router
