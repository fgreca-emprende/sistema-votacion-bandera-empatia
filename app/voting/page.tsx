"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Heart, Vote, ArrowLeft, CheckCircle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Candidate {
  id: string
  nombre: string
  apellido: string
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
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search)
    const gradoParam = urlParams.get("grado") || ""
    const cursoParam = urlParams.get("curso") || ""
    const mesParam = urlParams.get("mes") || ""
    const anoParam = urlParams.get("ano") || ""

    setGrado(gradoParam)
    setCurso(cursoParam)
    setMes(mesParam)
    setAno(anoParam)

    // Load candidates
    const saved = localStorage.getItem("empathy-candidates")
    if (saved) {
      const allCandidates = JSON.parse(saved)
      const filtered = allCandidates.filter((c: Candidate) => c.grado === gradoParam && c.curso === cursoParam)
      setCandidates(filtered)
    }

    // Check if already voted for this month/year
    const voteKey = `vote-${gradoParam}-${cursoParam}-${mesParam}-${anoParam}`
    const existingVote = localStorage.getItem(voteKey)
    if (existingVote) {
      setHasVoted(true)
    }

    setIsLoading(false)
  }, [])

  const submitVote = () => {
    if (!selectedCandidate) {
      toast({
        title: "Error",
        description: "Por favor selecciona un candidato",
        variant: "destructive",
      })
      return
    }

    // Save vote with month/year
    const voteKey = `vote-${grado}-${curso}-${mes}-${ano}`
    const voteData = {
      candidateId: selectedCandidate,
      timestamp: new Date().toISOString(),
      grado,
      curso,
      mes,
      ano,
    }

    localStorage.setItem(voteKey, JSON.stringify(voteData))

    // Update vote count for this month/year
    const votesKey = `empathy-votes-${mes}-${ano}`
    const existingVotes = JSON.parse(localStorage.getItem(votesKey) || "{}")

    if (!existingVotes[selectedCandidate]) {
      existingVotes[selectedCandidate] = 0
    }
    existingVotes[selectedCandidate]++

    localStorage.setItem(votesKey, JSON.stringify(existingVotes))

    setHasVoted(true)

    toast({
      title: "¡Voto registrado!",
      description: `Tu voto ha sido registrado para ${mes} ${ano}`,
    })
  }

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

  if (hasVoted) {
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
          <CardContent>
            <div className="p-3 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm text-blue-800">Ya has votado este mes. Podrás votar nuevamente el próximo mes.</p>
            </div>
            <Button onClick={() => (window.location.href = "/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>No hay candidatos</CardTitle>
            <CardDescription>
              No se encontraron candidatos para {grado} grado - {curso}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Bandera de la Empatía</CardTitle>
            <CardDescription>
              Votación para {mes} {ano}
            </CardDescription>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {mes} {ano}
              </Badge>
              <Badge variant="secondary">{grado} grado</Badge>
              <Badge variant="outline">{curso}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Instrucciones:</strong> Selecciona a UN SOLO compañero de tu clase que consideres que demuestra
                empatía hacia otros. Tu voto es secreto y solo puedes votar una vez por mes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
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
                      <Label htmlFor={candidate.id} className="flex-1 cursor-pointer font-medium text-lg">
                        {candidate.nombre} {candidate.apellido}
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
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={() => (window.location.href = "/")} variant="outline" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button onClick={submitVote} disabled={!selectedCandidate} className="flex-1">
                <Vote className="w-4 h-4 mr-2" />
                Confirmar Voto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
