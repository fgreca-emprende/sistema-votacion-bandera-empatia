// app/voting/page.tsx - Tu código original con mejoras visuales
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

  // Loading state mejorado
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

  // Ya votó - pantalla de confirmación mejorada
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
              <CardDescription className="text-lg">
                Tu voto ha sido registrado para {mes} {ano}
                <br />
                <Badge variant="outline" className="mt-2 border-green-300 text-green-700 bg-green-50">
                  {grado} grado - {curso}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {voteStatus.data.candidate.nombre.charAt(0)}{voteStatus.data.candidate.apellido.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Votaste por: <span className="text-green-700 dark:text-green-300">{voteStatus.data.candidate.nombre} {voteStatus.data.candidate.apellido}</span>
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Registrado: {new Date(voteStatus.data.timestamp).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                      ¡Gracias por participar!
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Solo puedes votar una vez por mes. Tu voto es secreto y seguro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => (window.location.href = "/")} 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
                <Button 
                  onClick={() => (window.location.href = `/results?mes=${mes}&ano=${ano}&grado=${grado}&curso=${curso}`)} 
                  variant="outline" 
                  className="flex-1 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-300 text-green-700 hover:border-green-400 transition-all duration-300 hover:scale-105"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Ver Resultados
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Floating theme toggle */}
        <div className="fixed bottom-6 right-6 animate-in slide-in-from-right duration-500 animation-delay-1000">
          <ThemeToggle />
        </div>
      </ThemeGradientBackground>
    )
  }

  // Período no activo mejorado
  if (voteStatus && !voteStatus.canVote) {
    const getStatusInfo = () => {
      switch (voteStatus.reason) {
        case 'PERIOD_NOT_ACTIVE':
          return {
            icon: <XCircle className="w-10 h-10 text-red-500" />,
            title: "Período de Votación No Activo",
            description: "No hay votación disponible en este momento",
            bgColor: "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
            cardColor: "bg-red-50 dark:bg-red-900/20",
            textColor: "text-red-800 dark:text-red-200",
            borderColor: "border-red-200 dark:border-red-800"
          }
        case 'PERIOD_NOT_STARTED':
          return {
            icon: <Clock className="w-10 h-10 text-orange-500" />,
            title: "Votación No Iniciada",
            description: "El período de votación aún no ha comenzado",
            bgColor: "bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20",
            cardColor: "bg-orange-50 dark:bg-orange-900/20",
            textColor: "text-orange-800 dark:text-orange-200",
            borderColor: "border-orange-200 dark:border-orange-800"
          }
        case 'PERIOD_ENDED':
          return {
            icon: <Calendar className="w-10 h-10 text-gray-500" />,
            title: "Votación Finalizada",
            description: "El período de votación ha terminado",
            bgColor: "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20",
            cardColor: "bg-gray-50 dark:bg-gray-900/20",
            textColor: "text-gray-800 dark:text-gray-200",
            borderColor: "border-gray-200 dark:border-gray-800"
          }
        default:
          return {
            icon: <AlertTriangle className="w-10 h-10 text-yellow-500" />,
            title: "Votación No Disponible",
            description: "No se puede votar en este momento",
            bgColor: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
            cardColor: "bg-yellow-50 dark:bg-yellow-900/20",
            textColor: "text-yellow-800 dark:text-yellow-200",
            borderColor: "border-yellow-200 dark:border-yellow-800"
          }
      }
    }

    const statusInfo = getStatusInfo()

    return (
      <ThemeGradientBackground variant="warm">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in-up duration-500 shadow-xl">
            <CardHeader>
              <div className="mx-auto mb-4 w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                {statusInfo.icon}
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {statusInfo.title}
              </CardTitle>
              <CardDescription className="text-base">
                {statusInfo.description}
                <br />
                <Badge variant="outline" className="mt-2">
                  {grado} grado - {curso}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 ${statusInfo.cardColor} border ${statusInfo.borderColor} rounded-xl`}>
                <p className={`${statusInfo.textColor} text-sm font-medium mb-2`}>
                  📅 {mes} {ano}
                </p>
                <p className={`${statusInfo.textColor} text-sm`}>
                  {voteStatus.message}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-2">
                  💡 ¿Qué puedes hacer?
                </p>
                <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 text-left">
                  <li>• Contacta al administrador para activar votaciones</li>
                  <li>• Verifica los períodos disponibles</li>
                  <li>• Regresa cuando esté activo el período</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => (window.location.href = "/")} 
                  className="flex-1 transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="flex-1 transition-all duration-300 hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Estado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="fixed bottom-6 right-6">
          <ThemeToggle />
        </div>
      </ThemeGradientBackground>
    )
  }

  // Error: no hay candidatos mejorado
  if (candidates.length === 0 && voteStatus?.canVote) {
    return (
      <ThemeGradientBackground variant="warm">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in-up duration-500 shadow-xl">
            <CardHeader>
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                Sin Candidatos
              </CardTitle>
              <CardDescription className="text-base">
                No hay candidatos disponibles para {grado} - {curso}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  📋 No se encontraron candidatos activos para este grado y curso.
                  Contacta al administrador para agregar candidatos.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => (window.location.href = "/")} 
                  className="flex-1 transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
                <Button 
                  onClick={() => loadCandidates(grado, curso)} 
                  variant="outline" 
                  className="flex-1 transition-all duration-300 hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recargar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="fixed bottom-6 right-6">
          <ThemeToggle />
        </div>
      </ThemeGradientBackground>
    )
  }

  // Pantalla principal de votación mejorada (solo si se puede votar)
  if (voteStatus?.canVote && !voteStatus.hasVoted) {
    return (
      <ThemeGradientBackground variant="purple">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-2xl animate-in fade-in-up duration-500">
            <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                  <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center shadow-2xl">
                    <Heart className="w-10 h-10 text-white animate-float" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Bandera de la Empatía
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                  Votación para {mes} {ano}
                </CardDescription>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 px-3 py-1">
                    {grado} grado • {curso}
                  </Badge>
                </div>
                <div className="flex justify-center mt-2">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 shadow-lg">
                    ✅ Período Activo
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Instrucciones:
                  </h3>
                  <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Selecciona al candidato que consideres más empático
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Solo puedes votar una vez por mes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Tu voto es secreto y seguro
                    </li>
                  </ul>
                </div>

                {candidates.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-6 text-center text-gray-900 dark:text-white">
                      Candidatos Disponibles ({candidates.length})
                    </h3>
                    <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate}>
                      <div className="grid gap-4">
                        {candidates.map((candidate, index) => (
                          <div 
                            key={candidate.id} 
                            className={cn(
                              "group flex items-center space-x-4 p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer",
                              "hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-600",
                              "animate-in slide-in-from-bottom duration-300",
                              selectedCandidate === candidate.id 
                                ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-105" 
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            )}
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <RadioGroupItem value={candidate.id} id={candidate.id} className="mt-1" />
                            <Label 
                              htmlFor={candidate.id} 
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300",
                                    selectedCandidate === candidate.id 
                                      ? "bg-gradient-to-r from-purple-500 to-blue-500 scale-110" 
                                      : "bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-purple-400 group-hover:to-blue-400"
                                  )}>
                                    {candidate.nombre.charAt(0)}{candidate.apellido.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">
                                      {candidate.nombre} {candidate.apellido}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {candidate.grado} - {candidate.curso}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedCandidate === candidate.id && (
                                    <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-in zoom-in duration-300" />
                                  )}
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "transition-all duration-300",
                                      selectedCandidate === candidate.id 
                                        ? "border-purple-400 text-purple-700 bg-purple-100 dark:border-purple-500 dark:text-purple-300 dark:bg-purple-900/30" 
                                        : "group-hover:border-purple-300 group-hover:text-purple-600"
                                    )}
                                  >
                                    Candidato
                                  </Badge>
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={() => (window.location.href = "/")} 
                    variant="outline" 
                    className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                  <Button 
                    onClick={submitVote} 
                    disabled={!selectedCandidate || isSubmitting}
                    className={cn(
                      "flex-1 transition-all duration-300 hover:scale-105 hover:shadow-xl",
                      selectedCandidate 
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg" 
                        : "bg-gray-300 dark:bg-gray-700"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                    ✨ Selecciona un candidato para continuar
                  </div>
                )}

                {selectedCandidate && (
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-in fade-in duration-300">
                    <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                      ✅ Has seleccionado a: <span className="font-bold">
                        {candidates.find(c => c.id === selectedCandidate)?.nombre} {candidates.find(c => c.id === selectedCandidate)?.apellido}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Floating theme toggle */}
        <div className="fixed bottom-6 right-6 animate-in slide-in-from-right duration-500 animation-delay-1000">
          <ThemeToggle />
        </div>
      </ThemeGradientBackground>
    )
  }

  // Estado por defecto mejorado (no debería llegar aquí)
  return (
    <ThemeGradientBackground variant="default">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center animate-in fade-in-up duration-500 shadow-xl">
          <CardHeader>
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-700 dark:text-gray-300">
              Estado Desconocido
            </CardTitle>
            <CardDescription className="text-base">
              No se pudo determinar el estado de la votación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Ocurrió un error inesperado. Por favor, recarga la página.
              </p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar Página
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="fixed bottom-6 right-6">
        <ThemeToggle />
      </div>
    </ThemeGradientBackground>
  )
}