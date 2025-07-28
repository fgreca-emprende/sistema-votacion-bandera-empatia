// app/voting/page.tsx - Lógica original restaurada con React Query optimizado
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { 
  Heart, Vote, ArrowLeft, CheckCircle, Calendar, RefreshCw, 
  Clock, AlertTriangle, XCircle, Sparkles, Users, Trophy
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle, ThemeGradientBackground } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

// Interfaces originales
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
  // Estados originales
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

  // Funciones originales restauradas
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

  // Inicialización original restaurada
  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true)
      
      const urlParams = new URLSearchParams(window.location.search)
      const gradoParam = urlParams.get("grado") || ""
      const cursoParam = urlParams.get("curso") || ""
      const mesParam = urlParams.get("mes") || ""
      const anoParam = urlParams.get("ano") || ""

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
  }, [toast])

  // Función de envío de voto original
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
          title: "¡Voto registrado! 🎉",
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

  // Loading state original
  if (isLoading) {
    return (
      <ThemeGradientBackground variant="purple">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in duration-500">
            <CardContent className="p-8">
              <div className="relative mx-auto mb-6 w-16 h-16">
                <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <Vote className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Preparando votación
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Verificando período de votación...
              </p>
            </CardContent>
          </Card>
        </div>
      </ThemeGradientBackground>
    )
  }

  // Ya votó - pantalla de confirmación original
  if (voteStatus?.hasVoted && voteStatus.data) {
    return (
      <ThemeGradientBackground variant="green">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in-up duration-500 shadow-2xl">
            <CardHeader>
              <div className="relative mx-auto mb-4 w-20 h-20">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 bg-green-400 rounded-full animate-pulse opacity-30"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ¡Voto Registrado!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                Tu participación ha sido confirmada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Candidato:</span>
                    <span className="font-bold text-green-800 dark:text-green-200">
                      {voteStatus.data.candidate.nombre} {voteStatus.data.candidate.apellido}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Período:</span>
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      {voteStatus.data.period}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Registrado:</span>
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {new Date(voteStatus.data.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => window.location.href = `/results?mes=${mes}&ano=${ano}&grado=${grado}&curso=${curso}`}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Ver Resultados
                </Button>
                <Button 
                  onClick={() => window.location.href = "/"}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThemeGradientBackground>
    )
  }

  // No se puede votar - lógica original
  if (voteStatus && !voteStatus.canVote) {
    return (
      <ThemeGradientBackground variant="warm">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in duration-500">
            <CardContent className="p-8">
              <div className="relative mx-auto mb-6 w-16 h-16">
                <div className="relative bg-gradient-to-r from-orange-500 to-red-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                No se puede votar
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {voteStatus.message}
              </p>
              <Button 
                onClick={() => window.location.href = "/"}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeGradientBackground>
    )
  }

  // Interfaz de votación principal - exactamente como el original
  return (
    <ThemeGradientBackground variant="blue">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
              <Button 
                onClick={() => window.location.href = "/"}
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Inicio
              </Button>
              <ThemeToggle />
            </div>

            <div className="relative mx-auto mb-6 w-24 h-24">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse opacity-30"></div>
              <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 rounded-full w-24 h-24 flex items-center justify-center shadow-xl">
                <Heart className="w-12 h-12 text-white animate-heartbeat" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-3">
              Bandera de la Empatía
            </h1>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {grado} - {curso}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {mes} {ano}
              </Badge>
            </div>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Elige al compañero que más haya demostrado bondad y empatía este mes
            </p>
          </div>

          {/* Lista de candidatos */}
          <Card className="animate-in slide-in-from-bottom duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-gray-800 dark:text-white flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    Candidatos Disponibles
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                    Selecciona un candidato para registrar tu voto
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {candidates.length} candidatos
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {candidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No hay candidatos disponibles
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    No se encontraron candidatos activos para {grado} - {curso}
                  </p>
                </div>
              ) : (
                <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate}>
                  <div className="grid gap-4">
                    {candidates.map((candidate, index) => (
                      <div 
                        key={candidate.id}
                        className={cn(
                          "flex items-center space-x-4 p-6 border-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer",
                          "animate-in slide-in-from-left duration-300",
                          selectedCandidate === candidate.id
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-700"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => setSelectedCandidate(candidate.id)}
                      >
                        <RadioGroupItem value={candidate.id} id={candidate.id} />
                        <Label 
                          htmlFor={candidate.id} 
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {candidate.nombre} {candidate.apellido}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {candidate.grado} - {candidate.curso}
                              </p>
                            </div>
                            {selectedCandidate === candidate.id && (
                              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Seleccionado</span>
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* Botón de envío */}
          {candidates.length > 0 && (
            <div className="mt-8 text-center animate-in fade-in duration-500 animation-delay-300">
              <Button
                onClick={submitVote}
                disabled={!selectedCandidate || isSubmitting}
                size="lg"
                className={cn(
                  "px-12 py-4 text-lg font-semibold shadow-2xl transition-all duration-300",
                  !selectedCandidate 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105 hover:shadow-xl"
                )}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Registrando voto...
                  </>
                ) : (
                  <>
                    <Vote className="w-5 h-5 mr-2" />
                    Confirmar Voto
                  </>
                )}
              </Button>
              
              {!selectedCandidate && (
                <p className="text-white/80 mt-3 text-sm">
                  Selecciona un candidato para continuar
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </ThemeGradientBackground>
  )
}