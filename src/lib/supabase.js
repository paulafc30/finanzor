import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // No reventamos en build, pero avisamos en consola si faltan vars
  // Aparecerá si te olvidas de configurar .env.local o las vars en Vercel
  console.warn(
    '[Finanzor] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
