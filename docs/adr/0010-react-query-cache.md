# ADR-0010 — React Query como única fuente de cache cliente

**Estado:** Aceptado.
**Fecha:** Inicio del proyecto.

## Contexto

Con Supabase como BaaS, el cliente hace queries directas a la BBDD desde
el navegador. Sin una capa de cache decente:

- Cada cambio de página re-fetch.
- Difícil compartir datos entre componentes (ej. la lista de transacciones
  la usan a la vez Dashboard, Movements y CategoryDonut).
- Tras crear/editar/borrar hay que recargar a mano.

Necesito una librería de cache reactiva con invalidación declarativa.

## Decisión

**TanStack React Query 5** (`@tanstack/react-query`) como única capa de
cache para todos los datos remotos:

- Una instancia única (`QueryClient`) en `src/lib/queryClient.js`.
- Cada hook de dominio (`useTransactions`, `useCategories`, `useBudgets`…)
  expone `useQuery` o `useMutation` con `queryKey` consistente.
- Las mutaciones invalidan las queries afectadas en su `onSuccess`. Ejemplo:
  `useCreateTransaction` invalida `['transactions', user.id]`,
  `['monthly-summary', user.id]`, etc.
- No se usa Redux, Zustand ni Context para estado servidor. **Context solo
  para estado UI compartido** (`MonthProvider`, `OnboardingProvider`).

## Consecuencias

✅ Refetch automáticos cuando vuelves a la pestaña tras un rato.
✅ Datos compartidos sin prop drilling.
✅ Invalidaciones explícitas y predecibles.
✅ `useAuthCacheSync` (en `src/hooks/`) puede limpiar todo el cache de un
   golpe al cambiar de usuario.

❌ Curva de aprendizaje de `queryKey` consistentes. Mitigación: convención
   `['<recurso>', user?.id, ...filtros]` repetida en todos los hooks.
❌ Cualquier estado servidor que no pase por React Query queda fuera de la
   invalidación → regla dura: **no llamar a Supabase desde un componente
   directamente**, siempre desde un hook.

## Aplicación

- `src/lib/queryClient.js` — config (`staleTime`, `gcTime`, retries).
- `src/main.jsx` — `<QueryClientProvider>` en la raíz.
- `src/hooks/useAuthCacheSync.js` — limpia cache al cambiar `user.id`.
- Convención: hooks reciben filtros como argumento (`useCategories({
  includeArchived })`) y los meten en la `queryKey` para que la cache no se
  pise.
