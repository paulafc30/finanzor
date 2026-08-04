# Migraciones Supabase

Para aplicar el esquema en un proyecto nuevo de Supabase, abre el **SQL Editor** y ejecuta los archivos en este orden:

1. `migrations/0001_init.sql` — crea las tablas y los índices
2. `migrations/0002_rls.sql` — activa Row-Level Security y políticas por usuario
3. `migrations/0003_seed_default_categories.sql` — trigger que siembra las 9 categorías por defecto al crear un usuario

## Verificar que RLS funciona

1. Crea dos usuarios de prueba desde la pantalla de signup de la app.
2. En el SQL Editor, ejecutado como cada uno (usando "Run as user" si Supabase lo permite, o desde el cliente):
   ```sql
   select count(*) from transactions;
   ```
   Debe devolver solo las filas del usuario logado, **nunca** las de otro.

## Regla central del modelo

`transactions.occurred_on` es la fecha lógica del movimiento (la que usa el usuario). `created_at` es solo cuándo se registró en la app. **Todos los filtros por mes y agregaciones usan `occurred_on`.**

## Borrado de cuenta (Edge Function)

`functions/delete-account/index.ts` borra de verdad la cuenta (incluida `auth.users`), no solo los datos. Necesita la service_role key, así que corre en el servidor, nunca en el frontend. Para desplegarla (una sola vez, o cada vez que cambie el código):

```
supabase functions deploy delete-account
```

No hace falta configurar secretos a mano: `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles automáticamente dentro de cualquier Edge Function del proyecto.

La RPC `delete_my_account` (0007) queda como estaba, pero ya no la usa el frontend: la Edge Function borra `auth.users` directamente y todas las tablas de dominio caen en cascada (`on delete cascade` desde `auth.users(id)`, ver 0001_init.sql).
