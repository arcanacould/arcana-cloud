export interface Tarotista {
  id: string
  organizacion_id: string | null
  nombre: string
  email: string
  telefono: string | null
  plan: 'S' | 'M' | 'L'
  suscripcion_activa: boolean
  fecha_registro: string
  created_at: string
  updated_at: string
}

export interface Consultante {
  id: string
  tarotista_id: string
  nombre: string
  email: string | null
  telefono: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface Sesion {
  id: string
  tarotista_id: string
  consultante_id: string
  fecha_inicio: string
  fecha_fin: string | null
  estado: 'activa' | 'completada' | 'cancelada'
  created_at: string
  updated_at: string
}

export interface Tirada {
  id: string
  sesion_id: string
  tarotista_id: string
  tipo: string
  pregunta: string | null
  created_at: string
}

export interface Carta {
  id: string
  tirada_id: string
  tarotista_id: string
  posicion: number
  nombre_carta: string
  es_invertida: boolean
  significado_general: string | null
  created_at: string
}

export interface Interpretacion {
  id: string
  carta_id: string
  tarotista_id: string
  contenido: string
  creado_por: 'sistema' | 'tarotista'
  created_at: string
  updated_at: string
}

export interface Memoria {
  id: string
  consultante_id: string
  tarotista_id: string
  tipo: 'creencia' | 'situacion' | 'hipotesis' | 'rasgo' | 'evento'
  contenido: string
  sesion_origen_id: string | null
  activa: boolean
  created_at: string
  updated_at: string
}

export interface Resumen {
  id: string
  sesion_id: string
  tarotista_id: string
  contenido: string
  created_at: string
}

export interface PerfilPersona {
  id: string
  tarotista_id: string
  version: number
  nombre_persona: string
  tono: string
  frases_caracteristicas: string | null
  estilo_cierre: string | null
  activa: boolean
  created_at: string
}

export interface AkeCarta {
  id: string
  nombre: string
  numero: number | null
  arcano: 'mayor' | 'menor'
  palo: 'copas' | 'espadas' | 'bastos' | 'oros' | null
  significado_general: string
  significado_amor: string | null
  significado_trabajo: string | null
  significado_salud: string | null
  significado_invertido: string | null
  keywords: string | null
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  tarotista_id: string | null
  email: string
  nombre: string
  rol: 'admin' | 'tarotista' | 'soporte'
  created_at: string
  updated_at: string
}

export interface AuthPayload {
  sub: string
  email: string
  role: string
  tarotistaId?: string
}
