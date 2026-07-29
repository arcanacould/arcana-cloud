import { supabase } from '../lib/supabase'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

const NUCLEO_FIJO = `Eres un tarotista profesional que usa el Método del Puente para interpretar el tarot.

REGLAS DEL MÉTODO DEL PUENTE:
1. Conecta cada carta con la situación concreta del consultante, no des significados genéricos.
2. Construye un puente entre el simbolismo de la carta y la pregunta realizada.
3. Identifica patrones entre las cartas para crear una narrativa coherente.
4. Concluye con un mensaje accionable o reflexión práctica.

REGLAS DE SEGURIDAD:
- No prometas resultados garantizados ni hagas predicciones absolutas.
- No reemplaces consejo médico, legal o profesional.
- Mantén un tono respetuoso y empoderador.
- Si el consultante expresa ideas de daño, deriva a ayuda profesional.`

export async function getPerfil(tarotistaId: string) {
  const { data } = await supabase
    .from('perfil_persona')
    .select('*')
    .eq('tarotista_id', tarotistaId)
    .eq('activa', true)
    .maybeSingle()
  return data
}

function construirPromptBase(
  tarotistaNombre: string,
  consultanteNombre: string,
  tono: string,
  frases: string,
  cierre: string,
  promptPersonalizado: string | null,
  extras: string,
): string {
  const personalizado = promptPersonalizado ? `\n\nINSTRUCCIONES ADICIONALES DEL TAROTISTA:\n${promptPersonalizado}` : ''
  return `${NUCLEO_FIJO}

DATOS DEL TAROTISTA:
Nombre: ${tarotistaNombre}
Tono: ${tono}
Frases características: ${frases}
Estilo de cierre: ${cierre}${personalizado}

${extras}`
}

export async function generarConGemini(prompt: string): Promise<string | null> {
  const MODELOS_PRIORIDAD = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
  for (const modelo of MODELOS_PRIORIDAD) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal,
        },
      )
      clearTimeout(timeout)
      const data: any = await res.json()
      if (!res.ok) {
        console.error(`Gemini ${modelo}:`, res.status, data?.error?.message || JSON.stringify(data).slice(0, 200))
        continue
      }
      const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (texto) return texto
    } catch (e: any) {
      console.error(`Gemini ${modelo} exception:`, e?.message || e)
    }
  }
  return null
}

export async function generarConOpenAI(prompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1500 }),
    })
    const data: any = await res.json()
    if (!res.ok) { console.error('OpenAI error:', res.status, JSON.stringify(data)); return null }
    return data.choices?.[0]?.message?.content || null
  } catch (e) {
    console.error('OpenAI exception:', e)
    return null
  }
}

export async function generarConDeepSeek(prompt: string): Promise<string | null> {
  if (!DEEPSEEK_API_KEY) return null
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: 'deepseek-v4-flash', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1500 }),
    })
    const data: any = await res.json()
    if (!res.ok) { console.error('DeepSeek error:', res.status, JSON.stringify(data)); return null }
    return data.choices?.[0]?.message?.content || null
  } catch (e) {
    console.error('DeepSeek exception:', e)
    return null
  }
}

export async function generarRespuesta(
  motor: string,
  prompt: string,
): Promise<string | null> {
  if (motor === 'deepseek') {
    const r = await generarConDeepSeek(prompt)
    if (r) return r
    const r2 = await generarConGemini(prompt)
    if (r2) return r2
    const r3 = await generarConOpenAI(prompt)
    if (r3) return r3
    return null
  }
  if (motor === 'openai') {
    const r = await generarConOpenAI(prompt)
    if (r) return r
  }
  const r = await generarConGemini(prompt)
  if (r) return r
  if (motor !== 'openai') {
    const r2 = await generarConOpenAI(prompt)
    if (r2) return r2
  }
  return null
}

export async function generarInterpretacionTirada(
  tarotistaId: string,
  consultanteNombre: string,
  preguntas: string[],
  cartas: Array<{ nombre_carta: string; es_invertida: boolean; posicion: number }>,
) {
  const perfil = await getPerfil(tarotistaId)
  const motor = perfil?.motor_ia || 'gemini'

  const { data: tarotista } = await supabase.from('tarotista').select('nombre').eq('id', tarotistaId).single()

  const cartasConSignificado = await Promise.all(
    cartas.map(async (c) => {
      const { data: ake } = await supabase
        .from('ake_carta')
        .select('significado_general, significado_invertido')
        .ilike('nombre', c.nombre_carta)
        .single()
      return {
        nombre: c.nombre_carta,
        posicion: c.posicion,
        esInvertida: c.es_invertida,
        significado: c.es_invertida ? ake?.significado_invertido || ake?.significado_general || '' : ake?.significado_general || '',
      }
    }),
  )

  const cartasTexto = cartasConSignificado
    .map((c) => `${c.posicion}. ${c.nombre}${c.esInvertida ? ' (invertida)' : ''} - ${c.significado}`)
    .join('\n')

  const extras = `CONSULTANTE: ${consultanteNombre}

PREGUNTA(S):
${preguntas.map((p, i) => `${i + 1}. ${p}`).join('\n')}

CARTAS TIRADAS:
${cartasTexto}

INTERPRETACIÓN:`

  const prompt = construirPromptBase(
    tarotista?.nombre || 'Tarotista',
    consultanteNombre,
    perfil?.tono || 'cálido y empático',
    perfil?.frases_caracteristicas || '',
    perfil?.estilo_cierre || 'con una reflexión final',
    perfil?.prompt_personalizado || null,
    extras,
  )

  const iaResponse = await generarRespuesta(motor, prompt)
  return {
    texto: iaResponse || `Interpretación para ${consultanteNombre}:\n\n${cartasConSignificado.map((c) => `• ${c.nombre}: ${c.significado}`).join('\n')}`,
    cartasConSignificado,
  }
}

export async function generarChatRespuesta(
  tarotistaId: string,
  consultanteNombre: string,
  mensaje: string,
  memorias: string[],
  ultimasTiradas: string[],
  fechaNacimiento?: string,
  motivo?: string,
) {
  const perfil = await getPerfil(tarotistaId)
  const motor = perfil?.motor_ia || 'gemini'

  const { data: tarotista } = await supabase.from('tarotista').select('nombre').eq('id', tarotistaId).single()

  const contextoStr = memorias.length ? `\nHistorial de la conversación:\n${memorias.map((m) => `• ${m}`).join('\n')}` : ''
  const tiradasStr = ultimasTiradas.length ? `\nTiradas realizadas:\n${ultimasTiradas.join('\n')}` : ''
  const datosConsultante = [fechaNacimiento && `Nacimiento: ${fechaNacimiento}`, motivo && `Motivo: ${motivo}`].filter(Boolean).join('\n')

  const extras = `Contexto del consultante:
Nombre: ${consultanteNombre}
${datosConsultante}${contextoStr}${tiradasStr}

Mensaje recibido: "${mensaje}"

Responde como tarotista, dando una interpretación empática y reflexiva. Si hay cartas en el historial, conéctalas con el mensaje actual. Si no hay cartas aún, invita a realizar una tirada. No uses markdown ni emojis excesivos. Máximo 3 párrafos.`

  const prompt = construirPromptBase(
    tarotista?.nombre || 'Tarotista',
    consultanteNombre,
    perfil?.tono || 'cálido y empático',
    perfil?.frases_caracteristicas || '',
    perfil?.estilo_cierre || 'con una reflexión final',
    perfil?.prompt_personalizado || null,
    extras,
  )

  const iaResponse = await generarRespuesta(motor, prompt)

  if (iaResponse) return iaResponse

  if (ultimasTiradas.length === 0) {
    return `Gracias por compartir eso, ${consultanteNombre}. Para poder ofrecerte una lectura más profunda con las cartas, te invito a realizar una tirada. Podés escribir los nombres de las cartas que quieras consultar (ej: "El Loco, La Emperatriz, El Sol"). Mientras tanto, reflexioná sobre tu pregunta. El tarot es un espejo del alma.`
  }

  return `Gracias por tu mensaje, ${consultanteNombre}. Basándome en las cartas que hemos visto y en lo que compartís, veo que las energías presentes te invitan a la reflexión profunda sobre tu situación. Hay un mensaje de transformación y crecimiento en el horizonte. Confiá en tu intuición, las cartas ya han hablado.`
}
