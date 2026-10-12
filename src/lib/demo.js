import { supabase } from './supabase.js'

/**
 * Arranca el modo demo sin registro:
 *  1. Crea una sesión anónima en Supabase (cada visitante tiene su propia
 *     cuenta temporal; los datos de unos no se mezclan con los de otros).
 *  2. Llama a la RPC `seed_demo_data` (migración 0013), que rellena esa
 *     cuenta con categorías, movimientos, presupuestos y metas de ejemplo.
 *
 * Requiere activar "Allow anonymous sign-ins" en Supabase (Authentication →
 * Sign In / Providers). Si la siembra falla se cierra la sesión anónima para
 * no dejar al visitante en una app vacía.
 */
export async function startDemo() {
  const { error: authError } = await supabase.auth.signInAnonymously()
  if (authError) throw authError

  const { error: seedError } = await supabase.rpc('seed_demo_data')
  if (seedError) {
    await supabase.auth.signOut()
    throw seedError
  }
}
