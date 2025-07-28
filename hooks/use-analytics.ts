// hooks/use-analytics.ts - Hooks optimizados para analytics y métricas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { useToast } from '@/hooks/use-toast'

// Tipos para Analytics
interface DashboardData {
  distribution: {
    byGrado: Array<{ grado: string; votes: number; percentage: number }>
    byCurso: Array<{ curso: string; votes: number; percentage: number }>
    byPeriod: Array<{ mes: string; ano: string; votes: number }>
  }
  topCandidates: Array<{
    candidate: {
      nombre: string
      apellido: string
      grado: string
      curso: string
    }
    votes: number
    percentage: number
  }>
  summary: {
    totalVotes: number
    totalCandidates: number
    activePeriods: number
    participationRate: number
  }
}

interface TrendsData {
  monthlyTrends: Array<{
    period: string
    mes: string
    ano: string
    totalVotes: number
    candidatesWithVotes: number
    participationGrowth: number
  }>
  gradoTrends: Array<{
    grado: string
    data: Array<{ period: string; votes: number }>
  }>
  summary: {
    totalPeriods: number
    averageVotesPerPeriod: number
    growthRate: number
    peakPeriod: string
  }
}

interface ParticipationData {
  byGrado: Array<{ grado: string; votes: number; percentage: number }>
  byCurso: Array<{ curso: string; votes: number; percentage: number }>
  matrix: Array<{ grado: string; curso: string; votes: number; percentage: number }>
  frequency: {
    totalUniqueVoters: number
    averageParticipation: number
  }
  totalVotes: number
}

interface PerformanceMetrics {
  system: {
    uptime: number
    uptimeFormatted: string
    nodeVersion: string
    platform: string
    architecture: string
  }
  memory: {
    used: number
    total: number
    usedFormatted: string
    totalFormatted: string
    usagePercentage: number
  }
  cpu: {
    usage: number
    cores: number
    model: string
    loadAverage: number[]
  }
  database: {
    totalRecords: number
    totalCandidates: number
    totalVotes: number
    totalUsers: number
    avgQueryTime: number
  }
  api: {
    totalRequests: number
    todayRequests: number
    errorRate: number
    avgResponseTime: number
  }
  cache: {
    hitRate: number
    missRate: number
    totalHits: number
    totalMisses: number
  }
}

// API Functions
const analyticsApi = {
  // Dashboard analytics
  getDashboard: async (): Promise<DashboardData> => {
    const response = await fetch('/api/analytics?type=dashboard')
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener datos del dashboard')
    }
    
    return data.data
  },

  // Trends analytics
  getTrends: async (period: string = '6'): Promise<TrendsData> => {
    const response = await fetch(`/api/analytics?type=trends&period=${period}`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener tendencias')
    }
    
    return data.data
  },

  // Participation analytics
  getParticipation: async (): Promise<ParticipationData> => {
    const response = await fetch('/api/analytics?type=participation')
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener datos de participación')
    }
    
    return data.data
  },

  // Performance metrics
  getPerformance: async (): Promise<PerformanceMetrics> => {
    const response = await fetch('/api/performance')
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener métricas de rendimiento')
    }
    
    return data.data
  },
}

// HOOKS PERSONALIZADOS

/**
 * Hook para obtener datos del dashboard principal
 */
export function useDashboardAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: analyticsApi.getDashboard,
    staleTime: 1000 * 60 * 3, // 3 minutos
    refetchInterval: 1000 * 60 * 5, // Refetch cada 5 minutos
  })
}

/**
 * Hook para obtener tendencias con período configurable
 */
export function useTrendsAnalytics(period: string = '6') {
  return useQuery({
    queryKey: queryKeys.analytics.trends(period),
    queryFn: () => analyticsApi.getTrends(period),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!period,
  })
}

/**
 * Hook para obtener datos de participación
 */
export function useParticipationAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.participation,
    queryFn: analyticsApi.getParticipation,
    staleTime: 1000 * 60 * 4, // 4 minutos
  })
}

/**
 * Hook para métricas de rendimiento en tiempo real
 */
export function usePerformanceMetrics() {
  return useQuery({
    queryKey: queryKeys.analytics.performance,
    queryFn: analyticsApi.getPerformance,
    staleTime: 1000 * 30, // 30 segundos para métricas de rendimiento
    refetchInterval: 1000 * 30, // Refetch cada 30 segundos
    refetchIntervalInBackground: true,
  })
}

/**
 * Hook para refrescar todas las métricas del dashboard
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      // Invalidar todas las queries de analytics
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.participation }),
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.performance }),
      ])
      return true
    },
    onSuccess: () => {
      toast({
        title: "Dashboard actualizado",
        description: "Todas las métricas han sido actualizadas exitosamente",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar las métricas del dashboard",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para analytics en tiempo real (para pantallas admin activas)
 */
export function useRealTimeAnalytics() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['analytics', 'realtime'],
    queryFn: async () => {
      // Obtener datos frescos de múltiples fuentes
      const [dashboard, participation, performance] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getParticipation(),
        analyticsApi.getPerformance(),
      ])

      return {
        dashboard,
        participation,
        performance,
        lastUpdate: new Date().toISOString(),
      }
    },
    staleTime: 1000 * 15, // 15 segundos para tiempo real
    refetchInterval: 1000 * 30, // Refetch cada 30 segundos
    refetchIntervalInBackground: true,
  })
}

/**
 * Hook para limpiar cache selectivamente
 */
export function useClearCache() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (cacheType: 'all' | 'analytics' | 'votes' | 'candidates' | 'periods') => {
      switch (cacheType) {
        case 'all':
          queryClient.clear()
          break
        case 'analytics':
          queryClient.removeQueries({ queryKey: ['analytics'] })
          break
        case 'votes':
          queryClient.removeQueries({ queryKey: ['votes'] })
          break
        case 'candidates':
          queryClient.removeQueries({ queryKey: ['candidates'] })
          break
        case 'periods':
          queryClient.removeQueries({ queryKey: ['periods'] })
          break
        default:
          throw new Error('Tipo de cache no válido')
      }
      return cacheType
    },
    onSuccess: (cacheType) => {
      toast({
        title: "Cache limpiado",
        description: `El cache de ${cacheType} ha sido limpiado exitosamente`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error al limpiar cache",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}