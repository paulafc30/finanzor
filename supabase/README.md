# Migraciones Supabase

Para aplicar el esquema en un proyecto nuevo de Supabase, abre el **SQL Editor** y ejecuta los archivos en este orden:

1. `migrations/0001_init.sql` — crea las tablas y los índices
2. `migrations/0002_rls.sql` — activa Row-Level Security y políticas por usuario
3. `migrations/0003_seed_default_categories.sql` — trigger que siembra las 9 categorías por defecto al crear un usuario
4. `migrations/0004` … `0012` — feedback, categorías archivables, ingresos fijos, métodos de pago, frecuencia semanal, etc. (cada archivo lleva su explicación al principio)
5. `migrations/0013_demo_mode_and_fixes.sql` — modo demo (`seed_demo_data`), arreglo del trigger de categorías, policy de feedback
6. `migrations/0015_category_rules.sql` — reglas de categorización propias del usuario (`category_rules`, con RLS)
7. `migrations/0016_demo_seed_v2.sql` — la demo incluye suscripción sin registrar, gastos hormiga y una regla de ejemplo (ejecutar después de 0015)
8. `migrations/0017_piggy_withdrawals.sql` — "Vaciar hucha" da el dinero por gastado sin tocar saldo ni movimientos (`piggy_withdrawals`, con RLS); convierte los ingresos "Hucha vaciada" de la versión anterior

Con el CLI de Supabase basta `supabase db push`.

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

La RPC `delete_my_account` (0007) se elimina en la 0013: la Edge Function borra `auth.users` directamente y todas las tablas de dominio caen en cascada (`on delete cascade` desde `auth.users(id)`, ver 0001_init.sql). Opcionalmente, restringe los orígenes permitidos con el secreto `ALLOWED_ORIGINS` (por defecto `https://finanzor.ferava.es` y `http://localhost:5173`).


## Modo demo ("Ver demo sin registrarme")

Cada visitante que pulsa el botón obtiene una **sesión anónima** de Supabase y la RPC `seed_demo_data()` (0013) le rellena una cuenta propia con ~3 meses de movimientos, presupuestos, gastos fijos y 2 metas de ahorro. Las fechas son relativas a hoy, así que la demo siempre parece reciente. Los datos de un visitante nunca se mezclan con los de otro (RLS).

Para activarlo:

1. **Authentication → Sign In / Providers → Allow anonymous sign-ins** (ON).
2. Recomendado: activar CAPTCHA (Authentication → Attack Protection) para que nadie llene la base de datos de cuentas anónimas. Supabase además limita las altas anónimas por IP.
3. Programa la limpieza de demos antiguas (SQL Editor):
   ```sql
   select cron.schedule('limpiar-demos', '0 4 * * *',
     $$ select public.cleanup_stale_demo_users(7) $$);
   ```
   (requiere activar la extensión `pg_cron`; o ejecuta `select public.cleanup_stale_demo_users(7);` a mano de vez en cuando).

`seed_demo_data()` rechaza cuentas no anónimas, así que una cuenta real nunca puede recibir datos de ejemplo, y es idempotente.
