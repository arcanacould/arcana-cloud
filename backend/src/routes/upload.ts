import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/foto', requireAuth, async (req: Request, res: Response) => {
  try {
    const { base64, nombre } = req.body
    if (!base64 || !nombre) {
      return res.status(400).json({ error: 'base64 y nombre son requeridos' })
    }

    const matches = base64.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      return res.status(400).json({ error: 'Formato base64 inválido. Debe ser data:image/...;base64,...' })
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
    const buffer = Buffer.from(matches[2], 'base64')
    const fileName = `${req.user!.tarotistaId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('tarotista-photos')
      .upload(fileName, buffer, {
        contentType: `image/${ext}`,
        upsert: false,
      })

    if (uploadError) return res.status(500).json({ error: uploadError.message })

    const { data: urlData } = supabase.storage
      .from('tarotista-photos')
      .getPublicUrl(fileName)

    const fotoUrl = urlData?.publicUrl || null

    if (fotoUrl) {
      await supabase
        .from('tarotista')
        .update({ foto_url: fotoUrl })
        .eq('id', req.user!.tarotistaId)
    }

    res.json({ foto_url: fotoUrl })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
