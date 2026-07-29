import { supabase } from '../lib/supabase'

const LIMITS: Record<string, { consultantes: number; sesiones: number }> = {
  S: { consultantes: 50, sesiones: 100 },
  M: { consultantes: 200, sesiones: 500 },
  L: { consultantes: -1, sesiones: -1 },
}

export async function checkPlanLimit(tarotistaId: string | undefined, table: 'consultante' | 'sesion'): Promise<string | null> {
  if (!tarotistaId) return 'Tarotista no identificado'
  const { data: tarotista } = await supabase
    .from('tarotista')
    .select('plan, suscripcion_activa')
    .eq('id', tarotistaId)
    .single()

  if (!tarotista) return 'Tarotista no encontrado'
  if (!tarotista.suscripcion_activa) return 'Suscripción inactiva'

  const limits = LIMITS[tarotista.plan]
  if (!limits) return null

  const limitKey = table === 'consultante' ? 'consultantes' : 'sesiones'
  const max = limits[limitKey]
  if (max === -1) return null

  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('tarotista_id', tarotistaId)

  if (count !== null && count >= max) {
    return `Límite del plan alcanzado: máximo ${max} ${table === 'consultante' ? 'consultantes' : 'sesiones'}`
  }

  return null
}
