// hooks/use-periods.ts - Hooks optimizados para períodos de votación
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { useToast } from '@/hooks/use-toast'

// Tipos
interface VotingPeriod {
  id: string
  mes: string
  ano: string
  active: boolean
  startDate: string
  endDate: string
  createdAt: string
  stats: {
    totalVotes: number
    candidatesWithVotes: number
  }
}

interface CreatePeriodData {
  mes: string
  ano: string
  active: boolean
  startDate: string
  endDate: string
}

interface UpdatePeriodData {
  id: string
  active?: boolean
  startDate?: string
  endDate?: string
}

interface PeriodStatus {
  success: boolean
  hasActivePeriod: boolean
  currentPeriod: {
    mes: string
    ano: string
    startDate: string
    endDate: string
  } | null
  periodStats?: {
    totalVotes: number
    totalCandidates: number
  }
  message: string
}

// API Functions
const periodsApi = {
  // Obtener todos los períodos
  getPeriods: async (): Promise<VotingPeriod[]> => {
    const response = await fetch('/api/voting-periods')
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener períodos')
    }
    
    return data.data
  },

  // Obtener períodos activos
  getActivePeriods: async (): Promise<VotingPeriod[]> => {
    const response = await fetch('/api/voting-periods?active=true')
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener períodos activos')
    }
    
    return data.data
  },

  // Obtener estado del período actual
  getPeriodStatus: async (): Promise<PeriodStatus> => {
    const response = await fetch('/api/period-status')
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener estado del período')
    }
    
    return data
  },

  // Crear nuevo período
  createPeriod: async (periodData: CreatePeriodData): Promise<VotingPeriod> => {
    const response = await fetch('/api/voting-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...periodData,
        startDate: new Date(periodData.startDate).toISOString(),
        endDate: new Date(periodData.endDate).toISOString(),
      }),
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al crear período')
    }
    
    return data.data
  },

  // Actualizar período
  updatePeriod: async (updateData: UpdatePeriodData): Promise<VotingPeriod> => {
    const response = await fetch('/api/voting-periods', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al actualizar período')
    }
    
    return data.data
  },

  // Eliminar período
  deletePeriod: async (id: string): Promise<void> => {
    const response = await fetch(`/api/voting-periods/${id}`, {
      method: 'DELETE',
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al eliminar período')
    }
  },
}

// HOOKS PERSONALIZADOS

/**
 * Hook para obtener todos los períodos
 */
export function usePeriods() {
  return useQuery({
    queryKey: queryKeys.periods.all,
    queryFn: periodsApi.getPeriods,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para obtener períodos activos
 */
export function useActivePeriods() {
  return useQuery({
    queryKey: queryKeys.periods.active,
    queryFn: periodsApi.getActivePeriods,
    staleTime: 1000 * 60 * 1, // 1 minuto para períodos activos
    refetchInterval: 1000 * 60 * 2, // Refetch cada 2 minutos
  })
}

/**
 * Hook para obtener el estado del período actual
 */
export function usePeriodStatus() {
  return useQuery({
    queryKey: queryKeys.system.periodStatus,
    queryFn: periodsApi.getPeriodStatus,
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 60, // Refetch cada minuto
  })
}

/**
 * Hook para crear período con optimistic updates
 */
export function useCreatePeriod() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: periodsApi.createPeriod,
    onSuccess: (newPeriod) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.periods.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.periods.active })
      queryClient.invalidateQueries({ queryKey: queryKeys.system.periodStatus })
      
      toast({
        title: "Período creado",
        description: `Período para ${newPeriod.mes} ${newPeriod.ano} creado exitosamente`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear período",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para actualizar período (activar/desactivar)
 */
export function useUpdatePeriod() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: periodsApi.updatePeriod,
    onMutate: async (updateData) => {
      // Cancelar queries pendientes
      await queryClient.cancelQueries({ queryKey: queryKeys.periods.all })

      // Obtener datos previos
      const previousPeriods = queryClient.getQueryData(queryKeys.periods.all)

      // Optimistic update
      if (previousPeriods && Array.isArray(previousPeriods)) {
        const updatedPeriods = previousPeriods.map((period: VotingPeriod) =>
          period.id === updateData.id 
            ? { ...period, active: updateData.active ?? period.active }
            : period
        )
        queryClient.setQueryData(queryKeys.periods.all, updatedPeriods)
      }

      return { previousPeriods }
    },
    onError: (error: Error, variables, context) => {
      // Revertir cambios optimistas
      if (context?.previousPeriods) {
        queryClient.setQueryData(queryKeys.periods.all, context.previousPeriods)
      }
      
      toast({
        title: "Error al actualizar período",
        description: error.message,
        variant: "destructive",
      })
    },
    onSuccess: (updatedPeriod) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.periods.active })
      queryClient.invalidateQueries({ queryKey: queryKeys.system.periodStatus })
      
      toast({
        title: "Período actualizado",
        description: `El período ${updatedPeriod.mes} ${updatedPeriod.ano} fue ${updatedPeriod.active ? 'activado' : 'desactivado'}`,
      })
    },
  })
}

/**
 * Hook para eliminar período
 */
export function useDeletePeriod() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: periodsApi.deletePeriod,
    onSuccess: (_, deletedId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.periods.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.periods.active })
      queryClient.invalidateQueries({ queryKey: queryKeys.system.periodStatus })
      
      toast({
        title: "Período eliminado",
        description: "El período fue eliminado exitosamente",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar período",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}