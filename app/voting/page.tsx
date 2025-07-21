"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Heart, Vote, ArrowLeft, CheckCircle, Calendar, RefreshCw } from "lucide-react"
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

export default function VotingPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [grado, setGrado] = useState("")
  const [curso, setCurso] = useState("")
  const [mes, setMes] = useState("")
  const [ano, setAno] = useState("")
  const [hasVoted, setHasVoted] = useState(false)
  const [voteData, setVoteData] = useState<VoteData | null>(null)
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

  // Verificar si ya se votó
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
        setHasVoted(data.hasVoted)
        if (data.hasVoted) {
          setVoteData(data.data)
        }
      } else {
        console.error('Error al verificar voto:', data.message)
      }
    } catch (error) {
      console.error('Error al verificar voto:', error)
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
        // Cargar candidatos y verificar estado de voto en paralelo
        await Promise.all([
          loadCandidates(gradoParam, cursoParam),
          checkVoteStatus(gradoParam, cursoParam, mesParam, anoParam)
        ])
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
        setHasVoted(true)
        setVoteData(data.data)
        
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
          <p>Cargando candidatos...</p>
        </div>
      </div>
    )
  }

  // Ya votó - pantalla de confirmación
  if (hasVoted && voteData) {
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
                Votaste por: <strong>{voteData.candidate.nombre} {voteData.candidate.apellido}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Registrado: {new Date(voteData.timestamp).toLocaleString('es-ES')}
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

  // Error: no hay candidatos
  if (candidates.length === 0) {
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

  // Pantalla principal de votación
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
              Votación para {mes} {ano} - {grado} grado, {curso}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Instrucciones:</strong>
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Selecciona un candidato de tu grado y curso</li>
                <li>• Solo puedes votar una vez por mes</li>
                <li>• Tu voto es secreto y seguro</li>
                <li>• Una vez enviado, no podrás cambiarlo</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Vote className="w-5 h-5" />
                Selecciona tu candidato ({candidates.length} candidatos disponibles):
              </h3>
              
              <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate}>
                <div className="space-y-3">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RadioGroupItem value={candidate.id} id={candidate.id} />
                      <Label 
                        htmlFor={candidate.id} 
                        className="flex-1 cursor-pointer font-medium text-lg flex items-center justify-between"
                      >
                        <span>{candidate.nombre} {candidate.apellido}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">{candidate.grado}</Badge>
                          <Badge variant="secondary">{candidate.curso}</Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {selectedCandidate && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  Has seleccionado: {candidates.find((c) => c.id === selectedCandidate)?.nombre}{" "}
                  {candidates.find((c) => c.id === selectedCandidate)?.apellido}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Revisa tu selección antes de confirmar el voto.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={() => (window.location.href = "/")} 
                variant="outline" 
                className="flex-1"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              
              <Button 
                onClick={submitVote} 
                disabled={!selectedCandidate || isSubmitting} 
                className="flex-1"
              >
                <Vote className="w-4 h-4 mr-2" />
                {isSubmitting ? "Enviando..." : "Confirmar Voto"}
              </Button>
            </div>

            {!selectedCandidate && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">
                  Selecciona un candidato para continuar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}