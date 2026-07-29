import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'
import { AuthPayload } from '../types'

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const token = header.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  let tarotistaId: string | undefined

  const { data: usuario } = await supabase
    .from('usuario')
    .select('tarotista_id')
    .eq('email', data.user.email)
    .single()

  if (usuario?.tarotista_id) {
    tarotistaId = usuario.tarotista_id
  } else {
    const { data: tarotista } = await supabase
      .from('tarotista')
      .select('id')
      .eq('email', data.user.email)
      .single()
    if (tarotista) tarotistaId = tarotista.id
  }

  req.user = {
    sub: data.user.id,
    email: data.user.email || '',
    role: data.user.role || 'authenticated',
    tarotistaId,
  }
  next()
}
