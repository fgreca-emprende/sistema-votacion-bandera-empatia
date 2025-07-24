// app/results/page.tsx - Código completo con mejoras visuales
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, ArrowLeft, Users, Vote, Calendar, RefreshCw, TrendingUp, Star, Award, Medal, Crown, Sparkles, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle, ThemeGradientBackground } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

const grados = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const cursos = ["Arrayan", "Jacarandá", "Ceibo"]
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
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

  useEffect(() => {
    loadResults()
  }, [selectedGrado, selectedCurso, selectedMes, selectedAno])

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

  const getPositionStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: <Crown className="w-6 h-6" />,
          bgGradient: "bg-gradient-to-r from-yellow-400 to-yellow-600",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-300",
          bgLight: "bg-yellow-100",
          label: "1er Lugar"
        }
      case 1:
        return {
          icon: <Medal className="w-6 h-6" />,
          bgGradient: "bg-gradient-to-r from-gray-400 to-gray-600",
          textColor: "text-gray-800",
          borderColor: "border-gray-300",
          bgLight: "bg-gray-100",
          label: "2do Lugar"
        }
      case 2:
        return {
          icon: <Award className="w-6 h-6" />,
          bgGradient: "bg-gradient-to-r from-amber-600 to-amber-800",
          textColor: "text-amber-800",
          borderColor: "border-amber-300",
          bgLight: "bg-amber-100",
          label: "3er Lugar"
        }
      default:
        return {
          icon: <Star className="w-5 h-5" />,
          bgGradient: "bg-gradient-to-r from-gray-500 to-gray-600",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
          bgLight: "bg-gray-50",
          label: `${index + 1}° Lugar`
        }
    }
  }

  return (
    <ThemeGradientBackground variant="blue">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <Card className="animate-in fade-in-down duration-500 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                      <Trophy className="w-8 h-8 text-white animate-float" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                      Resultados de Votación
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                      Bandera de la Empatía - {selectedMes} {selectedAno}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={loadResults} 
                    variant="outline" 
                    size="sm" 
                    disabled={isLoading}
                    className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                    Actualizar
                  </Button>
                  <Button 
                    onClick={() => (window.location.href = "/")} 
                    variant="outline"
                    className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Estadísticas generales */}
          <div className="grid md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-200">
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-8 pb-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <Vote className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">{totalVotes}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total de Votos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-8 pb-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 mb-1">{stats?.candidatesWithVotes || 0}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Candidatos con Votos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-8 pb-6">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mb-1">
                    {winner ? `${winner.candidate.nombre} ${winner.candidate.apellido}` : "Sin ganador"}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    {winner ? `${winner.votes} votos (${winner.percentage.toFixed(1)}%)` : "Ganador del Mes"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="animate-in slide-in-from-left duration-500 animation-delay-300 shadow-lg border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Filtros de Resultados
              </CardTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">📅 Mes:</label>
                  <Select value={selectedMes} onValueChange={setSelectedMes}>
                    <SelectTrigger className="transition-all duration-300 hover:shadow-md">
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">📊 Año:</label>
                  <Select value={selectedAno} onValueChange={setSelectedAno}>
                    <SelectTrigger className="transition-all duration-300 hover:shadow-md">
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">🎓 Grado:</label>
                  <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                    <SelectTrigger className="transition-all duration-300 hover:shadow-md">
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">📚 Curso:</label>
                  <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                    <SelectTrigger className="transition-all duration-300 hover:shadow-md">
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
            <div className="grid md:grid-cols-2 gap-6 animate-in slide-in-from-right duration-500 animation-delay-400">
              <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Participación por Grado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.participation.byGrado).map(([grado, votos], index) => (
                      <div 
                        key={grado} 
                        className="flex items-center justify-between animate-in slide-in-from-left duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{grado}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${totalVotes > 0 ? (votos / totalVotes) * 100 : 0}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 min-w-[2rem]">{votos}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Participación por Curso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.participation.byCurso).map(([curso, votos], index) => (
                      <div 
                        key={curso} 
                        className="flex items-center justify-between animate-in slide-in-from-right duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{curso}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${totalVotes > 0 ? (votos / totalVotes) * 100 : 0}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400 min-w-[2rem]">{votos}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Resultados detallados */}
          <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-500 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Resultados Detallados - {selectedMes} {selectedAno}
              </CardTitle>
              <CardDescription className="text-base">
                Mostrando resultados para {selectedGrado === "all" ? "todos los grados" : selectedGrado} -{" "}
                {selectedCurso === "all" ? "todos los cursos" : selectedCurso}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="relative mx-auto mb-6 w-16 h-16">
                    <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Cargando resultados...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-xl text-gray-500 dark:text-gray-400 mb-2 font-medium">No hay resultados para mostrar</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Verifica que haya candidatos y votos para el período seleccionado
                  </p>
                  <Button 
                    onClick={loadResults} 
                    variant="outline" 
                    className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recargar Resultados
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {results.map((result, index) => {
                    const positionStyle = getPositionStyle(index)
                    
                    return (
                      <div 
                        key={result.candidate.id} 
                        className={cn(
                          "p-6 border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                          "animate-in slide-in-from-bottom duration-500",
                          index === 0 && "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700",
                          index === 1 && "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-300 dark:border-gray-700",
                          index === 2 && "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-300 dark:border-amber-700",
                          index > 2 && "bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "flex items-center justify-center w-14 h-14 rounded-full font-bold text-xl shadow-lg transition-all duration-300 hover:scale-110",
                              positionStyle.bgGradient,
                              "text-white"
                            )}>
                              {index < 3 ? positionStyle.icon : index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-bold text-xl text-gray-900 dark:text-white">
                                  {result.candidate.nombre} {result.candidate.apellido}
                                </p>
                                {index === 0 && (
                                  <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1 animate-pulse">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Ganador
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge 
                                  variant="outline" 
                                  className="border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:bg-blue-900/20"
                                >
                                  {result.candidate.grado}
                                </Badge>
                                <Badge 
                                  variant="secondary" 
                                  className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                >
                                  {result.candidate.curso}
                                </Badge>
                                {!result.candidate.active && (
                                  <Badge variant="destructive">Inactivo</Badge>
                                )}
                                <Badge 
                                  className={cn(positionStyle.bgLight, positionStyle.textColor, "font-semibold")}
                                >
                                  {positionStyle.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{result.votes}</p>
                            <p className="text-lg text-gray-600 dark:text-gray-400 font-semibold">{result.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <Progress 
                            value={result.percentage} 
                            className="h-4 bg-gray-200 dark:bg-gray-700" 
                          />
                        </div>

                        {result.details && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Distribución de votos:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {Object.keys(result.details.grados).length > 0 && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <p className="font-semibold text-blue-700 dark:text-blue-300 mb-2">📊 Por Grado:</p>
                                  {Object.entries(result.details.grados).map(([grado, votos]) => (
                                    <p key={grado} className="text-blue-600 dark:text-blue-400">
                                      {grado}: <span className="font-semibold">{votos}</span> votos
                                    </p>
                                  ))}
                                </div>
                              )}
                              {Object.keys(result.details.cursos).length > 0 && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <p className="font-semibold text-green-700 dark:text-green-300 mb-2">📚 Por Curso:</p>
                                  {Object.entries(result.details.cursos).map(([curso, votos]) => (
                                    <p key={curso} className="text-green-600 dark:text-green-400">
                                      {curso}: <span className="font-semibold">{votos}</span> votos
                                    </p>
                                  ))}
                                </div>
                              )}
                              {Object.keys(result.details.meses).length > 0 && (
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                  <p className="font-semibold text-purple-700 dark:text-purple-300 mb-2">📅 Por Mes:</p>
                                  {Object.entries(result.details.meses).map(([mes, votos]) => (
                                    <p key={mes} className="text-purple-600 dark:text-purple-400">
                                      {mes}: <span className="font-semibold">{votos}</span> votos
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información adicional */}
          {stats && (
            <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-600 shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Información del Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border border-blue-200 dark:border-blue-700 transition-all duration-300 hover:scale-105">
                    <div className="text-center">
                      <Vote className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalVotes}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Votos Totales</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border border-green-200 dark:border-green-700 transition-all duration-300 hover:scale-105">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.totalCandidates}</p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">Candidatos Totales</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border border-purple-200 dark:border-purple-700 transition-all duration-300 hover:scale-105">
                    <div className="text-center">
                      <Star className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.candidatesWithVotes}</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Con Votos</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl border border-yellow-200 dark:border-yellow-700 transition-all duration-300 hover:scale-105">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                        {stats.totalVotes > 0 && stats.candidatesWithVotes > 0 
                          ? Math.round(stats.totalVotes / stats.candidatesWithVotes * 10) / 10
                          : 0}
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Promedio por Candidato</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span><strong>Período:</strong> {selectedMes} {selectedAno}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span><strong>Filtros:</strong> {selectedGrado === 'all' ? 'Todos los grados' : selectedGrado} - {selectedCurso === 'all' ? 'Todos los cursos' : selectedCurso}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span><strong>Última actualización:</strong> {new Date().toLocaleString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensaje de empatía */}
          <Card className="animate-in fade-in duration-500 animation-delay-700 shadow-xl border-0 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Heart className="w-8 h-8 text-pink-500 animate-heartbeat" />
                <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
                <Heart className="w-8 h-8 text-pink-500 animate-heartbeat" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                ¡Celebremos la Empatía!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Cada voto representa un acto de reconocimiento hacia la bondad y comprensión. 
                Gracias por participar en la construcción de una comunidad más empática.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Floating theme toggle */}
        <div className="fixed bottom-6 right-6 animate-in slide-in-from-right duration-500 animation-delay-1000">
          <ThemeToggle />
        </div>
      </div>
    </ThemeGradientBackground>
  )
}