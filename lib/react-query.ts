// lib/react-query.ts - Configuración optimizada de React Query
import { QueryClient } from '@tanstack/react-query'

// Configuración del QueryClient optimizada para nuestro sistema de votación
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por defecto
      staleTime: 1000 * 60 * 5, // 5 minutos
      
      // Mantener en cache por 10 minutos cuando no se usa
      gcTime: 1000 * 60 * 10, // 10 minutos (antes era cacheTime)
      
      // Refetch cuando la ventana vuelve a tener foco
      refetchOnWindowFocus: true,
      
      // Refetch cuando se reconecta a internet
      refetchOnReconnect: true,
      
      // Reintentar 3 veces en caso de error
      retry: (failureCount, error: any) => {
        // No reintentar errores 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3
      },
      
      // Intervalo de reintento exponencial
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Reintentar mutaciones fallidas 1 vez
      retry: 1,
      
      // Configuración de timeout para mutaciones
      networkMode: 'online',
    },
  },
})

// Query Keys estandarizadas para el sistema
export const queryKeys = {
  // Candidatos
  candidates: {
    all: ['candidates'] as const,
    filtered: (filters: { grado?: string; curso?: string; active?: boolean }) => 
      ['candidates', 'filtered', filters] as const,
    byId: (id: string) => ['candidates', id] as const,
  },
  
  // Votos
  votes: {
    all: ['votes'] as const,
    results: (filters: { mes?: string; ano?: string; grado?: string; curso?: string }) => 
      ['votes', 'results', filters] as const,
    status: (params: { grado: string; curso: string; mes: string; ano: string }) => 
      ['votes', 'status', params] as const,
  },
  
  // Períodos de votación
  periods: {
    all: ['periods'] as const,
    active: ['periods', 'active'] as const,
    byId: (id: string) => ['periods', id] as const,
  },
  
  // Analytics
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    trends: (period: string) => ['analytics', 'trends', period] as const,
    participation: ['analytics', 'participation'] as const,
    performance: ['analytics', 'performance'] as const,
  },
  
  // Estado del sistema
  system: {
    periodStatus: ['system', 'period-status'] as const,
  },
} as const

// Tipos para TypeScript
export type QueryKeyType = typeof queryKeys