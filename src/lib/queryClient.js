import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30s — los datos se consideran frescos
      gcTime: 1000 * 60 * 5,        // 5min — luego se limpian de cache
      refetchOnWindowFocus: false,  // evita refetch al cambiar de pestaña móvil
      retry: 1,
    },
  },
})
