"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, ArrowLeft, Users, Vote, Calendar, RefreshCw, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const grados = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const cursos = ["Arrayan", "Jacarandá", "Ceibo"]
const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const getCurrentYear = () => new Date().getFullYear()
const getCurrentMonth = () => meses[new Date().getMonth()]

interface Candidate {
  id: string
  nombre: string
  apellido: string
  grado: string
  curso: string
  active: boolean
}

interface ResultData {
  candidate: Candidate
  votes: number
  percentage: number
  details?: {
    grados: Record<string, number>
    cursos: Record<string, number>
    meses: Record<string, number>
  }
}

interface ResultsStats {
  totalVotes: number
  totalCandidates: number
  candidatesWithVotes: number
  period: { mes?: string; ano?: string }
  filters: { grado?: string; curso?: string }
  winner: ResultData | null
  participation: {
    byGrado: Record<string, number>
    byCurso: Record<string, number>
    byMes: Record<string, number>
  }
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultData[]>([])
  const [stats, setStats] = useState<ResultsStats | null>(null)
  const [selectedGrado, setSelectedGrado] = useState("all")
  const [selectedCurso, setSelectedCurso] = useState("all")
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth())
  const [selectedAno, setSelectedAno] = useState(getCurrentYear().toString())
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Cargar resultados desde la API
  const loadResults = async () => {
    try {
      setIsLoading(true)
      
      // Construir parámetros de consulta
      const params = new URLSearchParams({
        type: 'summary',
        mes: selectedMes,
        ano: selectedAno,
      })
      
      if (selectedGrado !== 'all') params.append('grado', selectedGrado)
      if (selectedCurso !== 'all') params.append('curso', selectedCurso)

      const response = await fetch(`/api/results?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data)
        setStats(data.stats)
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al cargar resultados",
          variant: "destructive",
        })
        setResults([])
        setStats(null)
      }
    } catch (error) {
      console.error('Error al cargar resultados:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar los resultados",
        variant: "destructive",
      })
      setResults([])
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar resultados cuando cambien los filtros
  useEffect(() => {
    loadResults()
  }, [selectedGrado, selectedCurso, selectedMes, selectedAno])

  // Inicializar con parámetros de URL si existen
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mesParam = urlParams.get("mes")
    const anoParam = urlParams.get("ano")
    const gradoParam = urlParams.get("grado")
    const cursoParam = urlParams.get("curso")

    if (mesParam) setSelectedMes(mesParam)
    if (anoParam) setSelectedAno(anoParam)
    if (gradoParam) setSelectedGrado(gradoParam)
    if (cursoParam) setSelectedCurso(cursoParam)
  }, [])

  const totalVotes = stats?.totalVotes || 0
  const winner = stats?.winner

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Resultados de Votación
                </CardTitle>
                <CardDescription>
                  Resultados de la votación Bandera de la Empatía - {selectedMes} {selectedAno}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadResults} variant="outline" size="sm" disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Button onClick={() => (window.location.href = "/")} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Estadísticas generales */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Vote className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{totalVotes}</p>
                <p className="text-sm text-gray-600">Total de Votos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats?.candidatesWithVotes || 0}</p>
                <p className="text-sm text-gray-600">Candidatos con Votos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-lg font-bold">
                  {winner ? `${winner.candidate.nombre} ${winner.candidate.apellido}` : "Sin ganador"}
                </p>
                <p className="text-sm text-gray-600">
                  {winner ? `${winner.votes} votos (${winner.percentage.toFixed(1)}%)` : "Ganador del Mes"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Filtros de Resultados
            </CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Mes:</label>
                <Select value={selectedMes} onValueChange={setSelectedMes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes} value={mes}>
                        {mes}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Año:</label>
                <Select value={selectedAno} onValueChange={setSelectedAno}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Grado:</label>
                <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grados</SelectItem>
                    {grados.map((grado) => (
                      <SelectItem key={grado} value={grado}>
                        {grado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Curso:</label>
                <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los cursos</SelectItem>
                    {cursos.map((curso) => (
                      <SelectItem key={curso} value={curso}>
                        {curso}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Estadísticas de participación */}
        {stats && stats.participation && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participación por Grado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.participation.byGrado).map(([grado, votos]) => (
                    <div key={grado} className="flex items-center justify-between">
                      <span className="font-medium">{grado}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${totalVotes > 0 ? (votos / totalVotes) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{votos}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participación por Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.participation.byCurso).map(([curso, votos]) => (
                    <div key={curso} className="flex items-center justify-between">
                      <span className="font-medium">{curso}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${totalVotes > 0 ? (votos / totalVotes) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{votos}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resultados detallados */}
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados Detallados - {selectedMes} {selectedAno}
            </CardTitle>
            <CardDescription>
              Mostrando resultados para {selectedGrado === "all" ? "todos los grados" : selectedGrado} -{" "}
              {selectedCurso === "all" ? "todos los cursos" : selectedCurso}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando resultados...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No hay resultados para mostrar</p>
                <p className="text-sm text-gray-400">
                  Verifica que haya candidatos y votos para el período seleccionado
                </p>
                <Button onClick={loadResults} variant="outline" className="mt-4">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recargar Resultados
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={result.candidate.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                              : index === 1
                                ? "bg-gray-100 text-gray-800 border-2 border-gray-300"
                                : index === 2
                                  ? "bg-orange-100 text-orange-800 border-2 border-orange-300"
                                  : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {result.candidate.nombre} {result.candidate.apellido}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{result.candidate.grado}</Badge>
                            <Badge variant="secondary">{result.candidate.curso}</Badge>
                            {!result.candidate.active && (
                              <Badge variant="destructive">Inactivo</Badge>
                            )}
                            {index === 0 && (
                              <Badge className="bg-yellow-500">
                                <Trophy className="w-3 h-3 mr-1" />
                                Ganador
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{result.votes}</p>
                        <p className="text-sm text-gray-600">{result.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <Progress value={result.percentage} className="h-3" />
                    </div>

                    {/* Detalles adicionales si están disponibles */}
                    {result.details && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Distribución de votos:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {Object.keys(result.details.grados).length > 0 && (
                            <div>
                              <p className="font-medium text-gray-600">Por Grado:</p>
                              {Object.entries(result.details.grados).map(([grado, votos]) => (
                                <p key={grado} className="text-gray-500">
                                  {grado}: {votos} votos
                                </p>
                              ))}
                            </div>
                          )}
                          {Object.keys(result.details.cursos).length > 0 && (
                            <div>
                              <p className="font-medium text-gray-600">Por Curso:</p>
                              {Object.entries(result.details.cursos).map(([curso, votos]) => (
                                <p key={curso} className="text-gray-500">
                                  {curso}: {votos} votos
                                </p>
                              ))}
                            </div>
                          )}
                          {Object.keys(result.details.meses).length > 0 && (
                            <div>
                              <p className="font-medium text-gray-600">Por Mes:</p>
                              {Object.entries(result.details.meses).map(([mes, votos]) => (
                                <p key={mes} className="text-gray-500">
                                  {mes}: {votos} votos
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información adicional */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Información del Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalVotes}</p>
                  <p className="text-sm text-blue-800">Votos Totales</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.totalCandidates}</p>
                  <p className="text-sm text-green-800">Candidatos Totales</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.candidatesWithVotes}</p>
                  <p className="text-sm text-purple-800">Con Votos</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.totalVotes > 0 && stats.candidatesWithVotes > 0 
                      ? Math.round(stats.totalVotes / stats.candidatesWithVotes * 10) / 10
                      : 0}
                  </p>
                  <p className="text-sm text-yellow-800">Promedio por Candidato</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Período:</strong> {selectedMes} {selectedAno} | 
                  <strong> Filtros:</strong> {selectedGrado === 'all' ? 'Todos los grados' : selectedGrado} - {selectedCurso === 'all' ? 'Todos los cursos' : selectedCurso} |
                  <strong> Última actualización:</strong> {new Date().toLocaleString('es-ES')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}