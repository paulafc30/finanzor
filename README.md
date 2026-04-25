# Finanzor

App de finanzas personales mes a mes. React + Vite + Supabase + Tailwind.

## Requisitos

- Node 18+
- Cuenta gratis en [Supabase](https://supabase.com)
- Cuenta gratis en [Vercel](https://vercel.com) (opcional para deploy)

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# edita .env.local con tu URL y anon key de Supabase

# 3. Arrancar en modo dev
npm run dev
```

Abre `http://localhost:5173`.

## Setup Supabase

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com) (región europea recomendada).
2. En **Project Settings → API**, copia `Project URL` y `anon public key` a tu `.env.local`.
3. Ve a **SQL Editor** y ejecuta en orden:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_seed_default_categories.sql`
4. Si quieres login con Google: **Authentication → Providers → Google**, sigue las instrucciones (necesitas crear credenciales OAuth en Google Cloud).

## Deploy en Vercel

1. Sube el repo a GitHub.
2. En Vercel, **Add New → Project** → importa tu repo.
3. En **Environment Variables**, añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Cada `git push` a `main` redespliega automáticamente.

## Estructura

```
src/
├─ main.jsx, App.jsx
├─ lib/        cliente Supabase, queryClient, formateadores
├─ hooks/      useSession, useMonth (mes seleccionado global)
├─ components/ layout (AppShell, BottomNav, MonthSwitcher), auth
└─ pages/      Login, Dashboard, Movements, Calendar, Budget, Savings, Settings

supabase/
└─ migrations/ scripts SQL para crear el esquema y RLS
```

## Regla importante del modelo

Todo filtro y agregación mensual usa **`transactions.occurred_on`** (la fecha real del movimiento), nunca `created_at`. Si registras hoy un gasto con fecha de ayer, cuenta en el mes de ayer.

## Roadmap

Ver `PLAN.md` para fases, modelo de datos completo y checklist del MVP.
