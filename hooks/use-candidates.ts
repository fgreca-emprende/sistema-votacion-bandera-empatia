// hooks/use-candidates.ts - Hooks optimizados para candidatos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { useToast } from '@/hooks/use-toast'

// Tipos
interface Candidate {
  id: string
  nombre: string
  apellido: string
  grado: string
  curso: string
  active: boolean
  createdAt: string
  updatedAt: string
}

interface CandidateFilters {
  grado?: string
  curso?: string
  active?: boolean
}

interface CreateCandidateData {
  nombre: string
  apellido: string
  grado: string
  curso: string
}

interface UpdateCandidateData extends Partial<CreateCandidateData> {
  active?: boolean
}

// API Functions
const candidatesApi = {
  // Obtener candidatos con filtros
  getCandidates: async (filters: CandidateFilters = {}): Promise<Candidate[]> => {
    const params = new URLSearchParams()
    
    if (filters.grado) params.append('grado', filters.grado)
    if (filters.curso) params.append('curso', filters.curso)
    if (filters.active !== undefined) params.append('active', filters.active.toString())
    
    const response = await fetch(`/api/candidates?${params.toString()}`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener candidatos')
    }
    
    return data.data
  },

  // Obtener candidato por ID
  getCandidateById: async (id: string): Promise<Candidate> => {
    const response = await fetch(`/api/candidates/${id}`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener candidato')
    }
    
    return data.data
  },

  // Crear candidato
  createCandidate: async (candidateData: CreateCandidateData): Promise<Candidate> => {
    const response = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al crear candidato')
    }
    
    return data.data
  },

  // Actualizar candidato
  updateCandidate: async (id: string, candidateData: UpdateCandidateData): Promise<Candidate> => {
    const response = await fetch(`/api/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al actualizar candidato')
    }
    
    return data.data
  },

  // Eliminar candidato
  deleteCandidate: async (id: string): Promise<void> => {
    const response = await fetch(`/api/candidates/${id}`, {
      method: 'DELETE',
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al eliminar candidato')
    }
  },
}

// HOOKS PERSONALIZADOS

/**
 * Hook para obtener candidatos con filtros y cache inteligente
 */
export function useCandidates(filters: CandidateFilters = {}) {
  return useQuery({
    queryKey: queryKeys.candidates.filtered(filters),
    queryFn: () => candidatesApi.getCandidates(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos para candidatos (se actualizan poco)
    select: (data) => {
      // Ordenar por grado, curso, apellido, nombre
      return data.sort((a, b) => {
        if (a.grado !== b.grado) return a.grado.localeCompare(b.grado)
        if (a.curso !== b.curso) return a.curso.localeCompare(b.curso)
        if (a.apellido !== b.apellido) return a.apellido.localeCompare(b.apellido)
        return a.nombre.localeCompare(b.nombre)
      })
    },
  })
}

/**
 * Hook para obtener candidatos activos por grado y curso (optimizado para votación)
 */
export function useActiveCandidates(grado?: string, curso?: string) {
  return useQuery({
    queryKey: queryKeys.candidates.filtered({ grado, curso, active: true }),
    queryFn: () => candidatesApi.getCandidates({ grado, curso, active: true }),
    staleTime: 1000 * 60 * 1, // 1 minuto para candidatos activos
    enabled: !!(grado && curso), // Solo ejecutar si tenemos grado y curso
  })
}

/**
 * Hook para obtener un candidato específico
 */
export function useCandidate(id: string) {
  return useQuery({
    queryKey: queryKeys.candidates.byId(id),
    queryFn: () => candidatesApi.getCandidateById(id),
    enabled: !!id,
  })
}

/**
 * Hook para crear candidato con optimistic updates
 */
export function useCreateCandidate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: candidatesApi.createCandidate,
    onSuccess: (newCandidate) => {
      // Invalidar todas las queries de candidatos para refrescar listas
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all })
      
      toast({
        title: "Candidato creado",
        description: `${newCandidate.nombre} ${newCandidate.apellido} fue agregado exitosamente`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear candidato",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para actualizar candidato con optimistic updates
 */
export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCandidateData }) =>
      candidatesApi.updateCandidate(id, data),
    onMutate: async ({ id, data }) => {
      // Cancelar queries pendientes
      await queryClient.cancelQueries({ queryKey: queryKeys.candidates.byId(id) })

      // Obtener datos previos
      const previousCandidate = queryClient.getQueryData(queryKeys.candidates.byId(id))

      // Optimistic update
      if (previousCandidate) {
        queryClient.setQueryData(queryKeys.candidates.byId(id), {
          ...previousCandidate,
          ...data,
        })
      }

      return { previousCandidate }
    },
    onError: (error: Error, variables, context) => {
      // Revertir cambios optimistas
      if (context?.previousCandidate) {
        queryClient.setQueryData(
          queryKeys.candidates.byId(variables.id),
          context.previousCandidate
        )
      }
      
      toast({
        title: "Error al actualizar candidato",
        description: error.message,
        variant: "destructive",
      })
    },
    onSuccess: (updatedCandidate) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all })
      
      toast({
        title: "Candidato actualizado",
        description: `Los datos de ${updatedCandidate.nombre} ${updatedCandidate.apellido} fueron actualizados`,
      })
    },
  })
}

/**
 * Hook para eliminar candidato
 */
export function useDeleteCandidate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: candidatesApi.deleteCandidate,
    onSuccess: (_, deletedId) => {
      // Invalidar todas las queries de candidatos
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all })
      
      // Remover candidato específico del cache
      queryClient.removeQueries({ queryKey: queryKeys.candidates.byId(deletedId) })
      
      toast({
        title: "Candidato eliminado",
        description: "El candidato fue eliminado exitosamente",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar candidato",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}