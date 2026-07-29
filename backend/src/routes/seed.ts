import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

router.post('/admin', async (_req: Request, res: Response) => {
  try {
    const email = 'admin@arcanacloud.com'
    const nombre = 'Admin Arcana'

    const { data: usuarioExistente } = await supabase
      .from('usuario')
      .select('id, rol')
      .eq('email', email)
      .single()

    if (usuarioExistente?.rol === 'admin') {
      return res.json({ message: 'Administrador ya existe', email, password: 'Usá la contraseña que registraste' })
    }

    const { data: existingOrg } = await supabase.from('organizacion').select('id').limit(1).single()
    if (!existingOrg) {
      await supabase.from('organizacion').insert({ nombre: 'Arcana Cloud' })
    }

    const { data: tarotista } = await supabase
      .from('tarotista')
      .upsert({ nombre, email, plan: 'L', suscripcion_activa: true }, { onConflict: 'email' })
      .select()
      .single()

    if (!tarotista) return res.status(500).json({ error: 'No se pudo crear el tarotista' })

    await supabase.from('usuario').upsert({
      tarotista_id: tarotista.id,
      email,
      nombre,
      rol: 'admin',
    }, { onConflict: 'email' })

    await supabase.from('perfil_persona').upsert({
      tarotista_id: tarotista.id,
      version: 1,
      nombre_persona: 'Adriana',
      tono: 'cálido y empático',
      frases_caracteristicas: 'Confía en el proceso, el tarot te guía',
      estilo_cierre: 'Con amor y luz, que el universo te acompañe',
      activa: true,
    }, { onConflict: 'tarotista_id, version' })

    const password = 'Admin123!'
    const { error: signUpErr } = await supabase.auth.signUp({ email, password })

    if (signUpErr?.message?.includes('already registered')) {
      return res.json({
        message: 'El usuario ya estaba registrado en Auth. Datos de la base actualizados.',
        email,
        password: 'Usá la contraseña que registraste originalmente o iniciá sesión con Google',
      })
    }

    if (signUpErr) return res.status(500).json({ error: signUpErr.message })

    res.json({ message: 'Administrador creado exitosamente', email, password })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/make-admin', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email requerido' })

    const { data: existing } = await supabase
      .from('usuario')
      .select('id, rol, tarotista_id')
      .eq('email', email)
      .single()

    if (existing) {
      await supabase.from('usuario').update({ rol: 'admin' }).eq('email', email)
      if (existing.tarotista_id) {
        await supabase.from('tarotista').update({ plan: 'L', suscripcion_activa: true }).eq('id', existing.tarotista_id)
      }
      return res.json({ message: `${email} ahora es administrador` })
    }

    const { data: tarotista } = await supabase
      .from('tarotista')
      .upsert({ nombre: email.split('@')[0], email, plan: 'L', suscripcion_activa: true }, { onConflict: 'email' })
      .select()
      .single()

    if (!tarotista) return res.status(500).json({ error: 'No se pudo crear tarotista' })

    await supabase.from('usuario').upsert({
      tarotista_id: tarotista.id,
      email,
      nombre: email.split('@')[0],
      rol: 'admin',
    }, { onConflict: 'email' })

    res.json({ message: `${email} creado y asignado como administrador` })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
