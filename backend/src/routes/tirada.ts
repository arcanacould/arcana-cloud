import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

const crearTiradaSchema = z.object({
  sesion_id: z.string().uuid(),
  tipo: z.string().min(1),
  pregunta: z.string().optional(),
  cartas: z.array(z.object({
    nombre_carta: z.string(),
    posicion: z.number().int().min(1),
    es_invertida: z.boolean().default(false),
  })).min(1).max(78),
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = crearTiradaSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { sesion_id, tipo, pregunta, cartas } = parsed.data

  const { data: sesion } = await supabase
    .from('sesion')
    .select('id, consultante_id, tarotista_id')
    .eq('id', sesion_id)
    .eq('tarotista_id', req.user!.tarotistaId)
    .single()
  if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })

  const { data: tirada, error: tiradaErr } = await supabase
    .from('tirada')
    .insert({ sesion_id, tarotista_id: req.user!.tarotistaId, tipo, pregunta: pregunta || null })
    .select()
    .single()
  if (tiradaErr) return res.status(500).json({ error: tiradaErr.message })

  const cartasInsert = cartas.map((c) => ({
    tirada_id: tirada.id,
    tarotista_id: req.user!.tarotistaId,
    nombre_carta: c.nombre_carta,
    posicion: c.posicion,
    es_invertida: c.es_invertida,
  }))

  const { data: cartasCreadas, error: cartasErr } = await supabase
    .from('carta')
    .insert(cartasInsert)
    .select()
  if (cartasErr) return res.status(500).json({ error: cartasErr.message })

  res.status(201).json({ tirada, cartas: cartasCreadas })
})

const interpretarSchema = z.object({
  tirada_id: z.string().uuid(),
})

router.post('/interpretar', requireAuth, async (req: Request, res: Response) => {
  const parsed = interpretarSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { tirada_id } = parsed.data

  const { data: tirada } = await supabase
    .from('tirada')
    .select('*, sesion!inner(*, consultante!inner(*)), carta(*)')
    .eq('id', tirada_id)
    .single()
  if (!tirada) return res.status(404).json({ error: 'Tirada no encontrada' })

  const cartasConSignificado = await Promise.all(
    tirada.carta.map(async (c: any) => {
      const { data: ake } = await supabase
        .from('ake_carta')
        .select('significado_general, significado_amor, significado_trabajo, significado_salud, significado_invertido')
        .ilike('nombre', c.nombre_carta)
        .single()
      return {
        nombre: c.nombre_carta,
        posicion: c.posicion,
        esInvertida: c.es_invertida,
        significado: c.es_invertida
          ? (ake?.significado_invertido || ake?.significado_general || '')
          : (ake?.significado_general || ''),
        significado_amor: ake?.significado_amor || '',
        significado_trabajo: ake?.significado_trabajo || '',
      }
    }),
  )

  const tarotistaId = tirada.sesion.tarotista_id

  const { data: perfil } = await supabase
    .from('perfil_persona')
    .select('*')
    .eq('tarotista_id', tarotistaId)
    .eq('activa', true)
    .single()

  const { data: tarotista } = await supabase
    .from('tarotista')
    .select('nombre')
    .eq('id', tarotistaId)
    .single()

  const consultanteNombre = tirada.sesion.consultante?.nombre || 'Consultante'

  const cartasTexto = cartasConSignificado
    .map((c) => `${c.posicion}. ${c.nombre}${c.esInvertida ? ' (invertida)' : ''}`)
    .join('\n')

  const prompt = construirPrompt({
    nombreTarotista: tarotista?.nombre || 'Tarotista',
    nombreConsultante: consultanteNombre,
    pregunta: tirada.pregunta || 'consulta general',
    cartasTexto,
    cartas: cartasConSignificado,
    tono: perfil?.tono || 'cálido y empático',
    frasesCaracteristicas: perfil?.frases_caracteristicas || '',
    estiloCierre: perfil?.estilo_cierre || 'con una reflexión final',
  })

  let interpretacionTexto: string

  if (process.env.OPENAI_API_KEY) {
    interpretacionTexto = await generarConOpenAI(prompt)
  } else {
    interpretacionTexto = generarMockInterpretacion(cartasConSignificado, consultanteNombre, tirada.pregunta)
  }

  const interpretaciones = await Promise.all(
    tirada.carta.map(async (c: any, idx: number) => {
      const cartaPrompt = `Interpretación para la carta ${c.nombre_carta} en posición ${c.posicion}:\n\n`
      const texto = interpretacionTexto.includes(cartaPrompt)
        ? interpretacionTexto.split(cartaPrompt)[1]?.split('\n\n')[0] || interpretacionTexto
        : interpretacionTexto

      const { data: interp } = await supabase
        .from('interpretacion')
        .insert({
          carta_id: c.id,
          tarotista_id: tarotistaId,
          contenido: texto,
          creado_por: 'sistema',
        })
        .select()
        .single()
      return interp
    }),
  )

  res.json({ interpretacion_general: interpretacionTexto, interpretaciones })
})

function construirPrompt(ctx: {
  nombreTarotista: string
  nombreConsultante: string
  pregunta: string
  cartasTexto: string
  cartas: any[]
  tono: string
  frasesCaracteristicas: string
  estiloCierre: string
}): string {
  return `Eres ${ctx.nombreTarotista}, un tarotista profesional que usa el Método del Puente.

REGLAS:
1. Conecta cada carta con la situación concreta del consultante.
2. Construye un puente entre el simbolismo de la carta y la pregunta.
3. Identifica patrones entre las cartas para crear una narrativa coherente.
4. Concluye con un mensaje accionable o reflexión práctica.

Tono: ${ctx.tono}
Frases características: ${ctx.frasesCaracteristicas}
Estilo de cierre: ${ctx.estiloCierre}

CONSULTANTE: ${ctx.nombreConsultante}
PREGUNTA: ${ctx.pregunta}

CARTAS TIRADAS:
${ctx.cartasTexto}

INTERPRETACIÓN:
`
}

async function generarConOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  })
  const data: any = await res.json()
  return data.choices?.[0]?.message?.content || 'No se pudo generar la interpretación.'
}

function generarMockInterpretacion(cartas: any[], consultante: string, pregunta: string): string {
  const saludos = ['Queridx', 'Amadx', 'Estimadx']
  const saludo = saludos[Math.floor(Math.random() * saludos.length)]
  const cierre = 'Que las estrellas iluminen tu camino. ✨'

  const interpretaciones = cartas.map((c) => {
    const invertida = c.esInvertida ? ' en posición invertida' : ''
    const significado = c.esInvertida
      ? `te advierte sobre bloqueos o energías estancadas en esta área.`
      : `trae una energía positiva y de apertura en este aspecto de tu vida.`
    return `**${c.nombre}${invertida}** — ${significado} ${c.significado || 'Esta carta te invita a la reflexión.'}`
  })

  return `${saludo} ${consultante}, gracias por confiar en mí para esta lectura sobre "${pregunta}".\n\n` +
    `Las cartas me muestran un panorama claro:\n\n${interpretaciones.join('\n\n')}\n\n` +
    `En conjunto, estas cartas sugieren que estás en un momento de ${cartas.length > 3 ? 'profunda transformación' : 'reflexión importante'}. ` +
    `Confía en tu intuición y recuerda que el tarot es una guía, no un destino.\n\n${cierre}`
}

export default router
