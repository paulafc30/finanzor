// Finanzor — Edge Function: borrado REAL de la cuenta (auth.users incluido).
//
// Por qué existe: la RPC `delete_my_account` (0007_delete_my_account.sql)
// solo puede borrar filas de las tablas de dominio porque corre con los
// permisos de un usuario normal. Borrar de `auth.users` requiere la
// service_role key, que NUNCA debe viajar al frontend. Por eso vive aquí,
// en una Edge Function que se ejecuta en el servidor de Supabase.
//
// Qué hace:
//   1. Valida el JWT del usuario que llama (header Authorization).
//   2. Con un cliente admin (service_role) borra su fila de auth.users.
//   3. Todas las tablas de dominio (categories, transactions, budgets,
//      recurring_expenses, goals, goal_contributions) tienen
//      `references auth.users(id) on delete cascade` (ver 0001_init.sql),
//      así que se borran solas en cascada — no hace falta borrarlas a mano.
//   4. `feedback` no tiene esa FK con cascade, así que la limpiamos aparte
//      por si el usuario había mandado alguna.
//
// Deploy (desde la carpeta del proyecto, con el CLI de Supabase instalado):
//   supabase functions deploy delete-account
//
// No hace falta configurar secretos a mano: SUPABASE_URL,
// SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY ya están disponibles como
// variables de entorno dentro de cualquier Edge Function del proyecto.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Cliente "as user": solo para verificar quién llama a partir de su JWT.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cliente admin: única pieza de código en todo el proyecto con
    // permiso para saltarse RLS y borrar auth.users. Nunca se expone
    // al cliente/frontend.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Por si quedara feedback sin borrar (no tiene cascade desde auth.users).
    await adminClient.from('feedback').delete().eq('user_id', user.id)

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    )

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Error inesperado' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
