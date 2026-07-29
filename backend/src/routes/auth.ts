import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
  rol: z.enum(['admin', 'tarotista', 'soporte']).default('tarotista'),
})

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { email, password } = parsed.data
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: error.message })

  const { data: tarotista } = await supabase
    .from('tarotista')
    .select('*')
    .eq('email', email)
    .single()

  res.json({ session: data.session, user: data.user, tarotista: tarotista || null })
})

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { email, password, nombre, rol } = parsed.data

  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
  if (authError) return res.status(400).json({ error: authError.message })
  if (!authData.user) return res.status(500).json({ error: 'Error al crear usuario' })

  const { data: existingOrg } = await supabase.from('organizacion').select('id').limit(1).single()
  if (!existingOrg) {
    await supabase.from('organizacion').insert({ nombre: 'Arcana Cloud' })
  }

  const { error: tError } = await supabase.from('tarotista').insert({
    nombre,
    email,
    plan: rol === 'admin' ? 'L' : 'S',
    suscripcion_activa: rol === 'admin',
  })
  if (tError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return res.status(500).json({ error: tError.message })
  }

  const { data: tarotista } = await supabase.from('tarotista').select('id').eq('email', email).single()
  if (tarotista) {
    await supabase.from('usuario').insert({
      tarotista_id: tarotista.id,
      email,
      nombre,
      rol,
    })
  }

  res.status(201).json({ user: authData.user, message: 'Registro exitoso. Revisa tu email para confirmar.' })
})

router.post('/logout', async (_req: Request, res: Response) => {
  const { error } = await supabase.auth.signOut()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

router.patch('/password', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({ current_password: z.string().min(6), new_password: z.string().min(6) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: req.user!.email,
    password: parsed.data.current_password,
  })
  if (signInErr) return res.status(400).json({ error: 'Contraseña actual incorrecta' })

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Contraseña actualizada exitosamente' })
})

router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' })

  const token = header.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return res.status(401).json({ error: error.message })

  const { data: usuario } = await supabase
    .from('usuario')
    .select('*, tarotista(*)')
    .eq('email', data.user.email)
    .single()

  res.json({ user: data.user, perfil: usuario })
})

// Admin: delete tarotista (auth user + all data)
router.delete('/admin/tarotista/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: tarotista } = await supabase.from('tarotista').select('id, email').eq('id', id).single()
    if (!tarotista) return res.status(404).json({ error: 'Tarotista no encontrado' })

    const { data: usuarios } = await supabase.from('usuario').select('id').eq('tarotista_id', id)
    for (const u of usuarios || []) {
      await supabase.from('usuario').delete().eq('id', u.id)
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers.users.find((u: any) => u.email === tarotista.email)
    if (authUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
    }

    const { error } = await supabase.from('tarotista').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })

    res.json({ message: 'Tarotista eliminado exitosamente' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Admin: list all tarotistas with subscription info
router.get('/admin/suscripciones', requireAuth, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('tarotista')
      .select('id, nombre, email, plan, suscripcion_activa, fecha_registro, proxima_facturacion, created_at')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || [])
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// Admin: update tarotista subscription
router.patch('/admin/suscripcion/:id', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    plan: z.enum(['S', 'M', 'L']).optional(),
    suscripcion_activa: z.boolean().optional(),
    proxima_facturacion: z.string().optional().nullable(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const updates: Record<string, any> = { ...parsed.data }
  if (updates.proxima_facturacion === null) updates.proxima_facturacion = null

  const { data, error } = await supabase
    .from('tarotista')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Admin: change tarotista password
router.patch('/admin/tarotista/:id/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const { data: tarotista } = await supabase.from('tarotista').select('email').eq('id', id).single()
    if (!tarotista) return res.status(404).json({ error: 'Tarotista no encontrado' })

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers.users.find((u: any) => u.email === tarotista.email)
    if (!authUser) return res.status(404).json({ error: 'Usuario de autenticación no encontrado' })

    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password })
    if (error) return res.status(500).json({ error: error.message })

    res.json({ message: 'Contraseña actualizada exitosamente' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
