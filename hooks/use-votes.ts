// hooks/use-votes.ts - Hooks optimizados para votos y resultados
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { useToast } from '@/hooks/use-toast'

// Tipos
interface VoteData {
  candidate: {
    nombre: string
    apellido: string
  }
  timestamp: string
  period: string
  grado: string
  curso: string
}

interface VoteStatusResponse {
  success: boolean
  hasVoted: boolean
  canVote: boolean
  reason?: string
  message: string
  data?: VoteData
}

interface VoteParams {
  grado: string
  curso: string
  mes: string
  ano: string
}

interface CreateVoteData extends VoteParams {
  candidateId: string
}

interface ResultData {
  candidate: {
    id: string
    nombre: string
    apellido: string
    grado: string
    curso: string
    active: boolean
  }
  votes: number
  percentage: number
}

interface ResultsStats {
  totalVotes: number
  totalCandidates: number
  period: { mes?: string; ano?: string }
  filters: { grado?: string; curso?: string }
  winner: ResultData | null
}

interface ResultsResponse {
  success: boolean
  data: ResultData[]
  stats: ResultsStats
  message: string
}

// API Functions
const votesApi = {
  // Verificar estado de votación
  checkVoteStatus: async (params: VoteParams): Promise<VoteStatusResponse> => {
    const response = await fetch('/api/votes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al verificar estado de votación')
    }
    
    return data
  },

  // Crear voto
  createVote: async (voteData: CreateVoteData): Promise<VoteData> => {
    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData),
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al registrar voto')
    }
    
    return data.data
  },

  // Obtener resultados
  getResults: async (filters: Partial<VoteParams> = {}): Promise<ResultsResponse> => {
    const params = new URLSearchParams()
    
    if (filters.mes) params.append('mes', filters.mes)
    if (filters.ano) params.append('ano', filters.ano)
    if (filters.grado) params.append('grado', filters.grado)
    if (filters.curso) params.append('curso', filters.curso)
    
    const response = await fetch(`/api/votes?${params.toString()}`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener resultados')
    }
    
    return data
  },
}

// HOOKS PERSONALIZADOS

/**
 * Hook para verificar el estado de votación
 */
export function useVoteStatus(params: VoteParams) {
  return useQuery({
    queryKey: queryKeys.votes.status(params),
    queryFn: () => votesApi.checkVoteStatus(params),
    staleTime: 1000 * 30, // 30 segundos (el estado puede cambiar rápido)
    refetchInterval: 1000 * 60, // Refetch cada minuto en background
    enabled: !!(params.grado && params.curso && params.mes && params.ano),
  })
}

/**
 * Hook para obtener resultados con cache optimizado
 */
export function useResults(filters: Partial<VoteParams> = {}) {
  return useQuery({
    queryKey: queryKeys.votes.results(filters),
    queryFn: () => votesApi.getResults(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos para resultados
    select: (data) => ({
      ...data,
      data: data.data.map((result, index) => ({
        ...result,
        position: index + 1, // Agregar posición en el ranking
      })),
    }),
  })
}

/**
 * Hook para crear voto con optimistic updates y cache invalidation
 */
export function useCreateVote() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: votesApi.createVote,
    onMutate: async (voteData) => {
      // Cancelar queries pendientes relacionadas
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.votes.status({
          grado: voteData.grado,
          curso: voteData.curso,
          mes: voteData.mes,
          ano: voteData.ano,
        })
      })

      // Optimistic update del estado de votación
      const voteStatusKey = queryKeys.votes.status({
        grado: voteData.grado,
        curso: voteData.curso,
        mes: voteData.mes,
        ano: voteData.ano,
      })

      const previousStatus = queryClient.getQueryData(voteStatusKey)

      // Actualizar optimísticamente que ya votó
      queryClient.setQueryData(voteStatusKey, {
        success: true,
        hasVoted: true,
        canVote: false,
        message: 'Voto registrado exitosamente',
      })

      return { previousStatus, voteStatusKey }
    },
    onError: (error: Error, voteData, context) => {
      // Revertir cambios optimistas
      if (context?.previousStatus && context?.voteStatusKey) {
        queryClient.setQueryData(context.voteStatusKey, context.previousStatus)
      }
      
      toast({
        title: "Error al votar",
        description: error.message,
        variant: "destructive",
      })
    },
    onSuccess: (data, voteData) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.votes.results({
          mes: voteData.mes,
          ano: voteData.ano,
        })
      })

      // Invalidar resultados generales
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.votes.results({})
      })

      // Invalidar analytics que puedan verse afectados
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.dashboard
      })

      toast({
        title: "¡Voto registrado! 🎉",
        description: `Tu voto por ${data.candidate.nombre} ${data.candidate.apellido} fue registrado exitosamente`,
      })
    },
  })
}

/**
 * Hook para refrescar resultados manualmente
 */
export function useRefreshResults() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (filters: Partial<VoteParams> = {}) => {
      // Invalidar y refetch resultados
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.votes.results(filters)
      })
      return true
    },
    onSuccess: () => {
      toast({
        title: "Resultados actualizados",
        description: "Los datos se han actualizado con la información más reciente",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar los resultados",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para obtener resultados en tiempo real (para dashboard admin)
 */
export function useRealTimeResults(filters: Partial<VoteParams> = {}) {
  return useQuery({
    queryKey: queryKeys.votes.results(filters),
    queryFn: () => votesApi.getResults(filters),
    staleTime: 1000 * 30, // 30 segundos para admin
    refetchInterval: 1000 * 60, // Refetch cada minuto
    refetchIntervalInBackground: true, // Continuar refetch en background
  })
}