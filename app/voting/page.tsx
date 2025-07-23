"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { 
  Heart, Vote, ArrowLeft, CheckCircle, Calendar, RefreshCw, 
  Clock, AlertTriangle, XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Candidate {
  id: string
  nombre: string
  apellido: string
  grado: string
  curso: string
  active: boolean
}

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

export default function VotingPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [grado, setGrado] = useState("")
  const [curso, setCurso] = useState("")
  const [mes, setMes] = useState("")
  const [ano, setAno] = useState("")
  const [voteStatus, setVoteStatus] = useState<VoteStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Cargar candidatos desde la API
  const loadCandidates = async (gradoParam: string, cursoParam: string) => {
    try {
      const response = await fetch(`/api/candidates?grado=${gradoParam}&curso=${cursoParam}&active=true`)
      const data = await response.json()

      if (data.success) {
        setCandidates(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al cargar candidatos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al cargar candidatos:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar los candidatos",
        variant: "destructive",
      })
    }
  }

  // Verificar estado de votación y período activo
  const checkVoteStatus = async (gradoParam: string, cursoParam: string, mesParam: string, anoParam: string) => {
    try {
      const response = await fetch('/api/votes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grado: gradoParam,
          curso: cursoParam,
          mes: mesParam,
          ano: anoParam,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setVoteStatus(data)
      } else {
        console.error('Error al verificar voto:', data.message)
        toast({
          title: "Error",
          description: data.message || "Error al verificar estado de votación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al verificar voto:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudo verificar el estado de votación",
        variant: "destructive",
      })
    }
  }

  // Inicialización
  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true)
      
      // Obtener parámetros de la URL
      const urlParams = new URLSearchParams(window.location.search)
      const gradoParam = urlParams.get("grado") || ""
      const cursoParam = urlParams.get("curso") || ""
      const mesParam = urlParams.get("mes") || ""
      const anoParam = urlParams.get("ano") || ""

      // Validar parámetros obligatorios
      if (!gradoParam || !cursoParam || !mesParam || !anoParam) {
        toast({
          title: "Parámetros faltantes",
          description: "Faltan datos necesarios para la votación. Regresando al inicio.",
          variant: "destructive",
        })
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
        return
      }

      setGrado(gradoParam)
      setCurso(cursoParam)
      setMes(mesParam)
      setAno(anoParam)

      try {
        // Verificar estado primero, luego cargar candidatos solo si es necesario
        await checkVoteStatus(gradoParam, cursoParam, mesParam, anoParam)
        
        // Solo cargar candidatos si se puede votar
        const statusResponse = await fetch('/api/votes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grado: gradoParam,
            curso: cursoParam,
            mes: mesParam,
            ano: anoParam,
          }),
        })
        
        const statusData = await statusResponse.json()
        
        if (statusData.success && statusData.canVote && !statusData.hasVoted) {
          await loadCandidates(gradoParam, cursoParam)
        }
      } catch (error) {
        console.error('Error en inicialización:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializePage()
  }, [])

  // Enviar voto
  const submitVote = async () => {
    if (!selectedCandidate) {
      toast({
        title: "Error",
        description: "Por favor selecciona un candidato",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          grado,
          curso,
          mes,
          ano,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar estado de voto
        setVoteStatus({
          success: true,
          hasVoted: true,
          canVote: false,
          data: data.data,
          message: data.message
        })
        
        toast({
          title: "¡Voto registrado!",
          description: data.message,
        })
      } else {
        toast({
          title: "Error al votar",
          description: data.message || "No se pudo registrar el voto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al enviar voto:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudo registrar el voto. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Verificando período de votación...</p>
        </div>
      </div>
    )
  }

  // Ya votó - pantalla de confirmación
  if (voteStatus?.hasVoted && voteStatus.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">¡Voto Registrado!</CardTitle>
            <CardDescription>
              Tu voto ha sido registrado para {mes} {ano}
              <br />
              {grado} grado - {curso}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Ya has votado este mes.</strong>
              </p>
              <p className="text-blue-700">
                Votaste por: <strong>{voteStatus.data.candidate.nombre} {voteStatus.data.candidate.apellido}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Registrado: {new Date(voteStatus.data.timestamp).toLocaleString('es-ES')}
              </p>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Importante:</strong> Solo puedes votar una vez por mes. Tu voto es secreto y seguro.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => (window.location.href = "/")} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
              <Button 
                onClick={() => (window.location.href = `/results?mes=${mes}&ano=${ano}&grado=${grado}&curso=${curso}`)} 
                variant="outline" 
                className="flex-1"
              >
                Ver Resultados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Período no activo
  if (voteStatus && !voteStatus.canVote) {
    const getStatusInfo = () => {
      switch (voteStatus.reason) {
        case 'PERIOD_NOT_ACTIVE':
          return {
            icon: <XCircle className="w-8 h-8 text-red-500" />,
            title: "Período de Votación No Activo",
            description: "No hay votación disponible en este momento",
            bgColor: "bg-red-50",
            textColor: "text-red-800",
            borderColor: "border-red-200"
          }
        case 'PERIOD_NOT_STARTED':
          return {
            icon: <Clock className="w-8 h-8 text-orange-500" />,
            title: "Votación No Iniciada",
            description: "El período de votación aún no ha comenzado",
            bgColor: "bg-orange-50",
            textColor: "text-orange-800",
            borderColor: "border-orange-200"
          }
        case 'PERIOD_ENDED':
          return {
            icon: <Calendar className="w-8 h-8 text-gray-500" />,
            title: "Votación Finalizada",
            description: "El período de votación ha terminado",
            bgColor: "bg-gray-50",
            textColor: "text-gray-800",
            borderColor: "border-gray-200"
          }
        default:
          return {
            icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
            title: "Votación No Disponible",
            description: "No se puede votar en este momento",
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-800",
            borderColor: "border-yellow-200"
          }
      }
    }

    const statusInfo = getStatusInfo()

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              {statusInfo.icon}
            </div>
            <CardTitle className="text-xl font-bold">{statusInfo.title}</CardTitle>
            <CardDescription>
              {statusInfo.description}
              <br />
              {grado} grado - {curso}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg`}>
              <p className={`${statusInfo.textColor} text-sm font-medium mb-2`}>
                {mes} {ano}
              </p>
              <p className={`${statusInfo.textColor} text-sm`}>
                {voteStatus.message}
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>¿Qué puedes hacer?</strong>
              </p>
              <ul className="text-blue-700 text-sm mt-1 text-left">
                <li>• Contacta al administrador para activar votaciones</li>
                <li>• Verifica los períodos disponibles</li>
                <li>• Regresa cuando esté activo el período</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => (window.location.href = "/")} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Estado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error: no hay candidatos
  if (candidates.length === 0 && voteStatus?.canVote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-yellow-700">Sin Candidatos</CardTitle>
            <CardDescription>
              No hay candidatos disponibles para {grado} - {curso}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 text-sm">
                No se encontraron candidatos activos para este grado y curso.
                Contacta al administrador para agregar candidatos.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => (window.location.href = "/")} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
              <Button 
                onClick={() => loadCandidates(grado, curso)} 
                variant="outline" 
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pantalla principal de votación (solo si se puede votar)
  if (voteStatus?.canVote && !voteStatus.hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Bandera de la Empatía</CardTitle>
              <CardDescription>
                Votación para {mes} {ano} - {grado} grado - {curso}
              </CardDescription>
              <div className="flex justify-center mt-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Período Activo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Instrucciones:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Selecciona al candidato que consideres más empático</li>
                  <li>• Solo puedes votar una vez por mes</li>
                  <li>• Tu voto es secreto y seguro</li>
                </ul>
              </div>

              {candidates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-center">
                    Candidatos Disponibles ({candidates.length})
                  </h3>
                  <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate}>
                    <div className="grid gap-3">
                      {candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value={candidate.id} id={candidate.id} />
                          <Label 
                            htmlFor={candidate.id} 
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">
                                  {candidate.nombre} {candidate.apellido}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {candidate.grado} - {candidate.curso}
                                </div>
                              </div>
                              <Badge variant="outline">
                                Candidato
                              </Badge>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => (window.location.href = "/")} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <Button 
                  onClick={submitVote} 
                  disabled={!selectedCandidate || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4 mr-2" />
                      Confirmar Voto
                    </>
                  )}
                </Button>
              </div>

              {!selectedCandidate && (
                <div className="text-center text-sm text-gray-500">
                  Selecciona un candidato para continuar
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Estado por defecto (no debería llegar aquí)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-700">Estado Desconocido</CardTitle>
          <CardDescription>
            No se pudo determinar el estado de la votación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar Página
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}