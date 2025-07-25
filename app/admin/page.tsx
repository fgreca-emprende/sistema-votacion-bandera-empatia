// app/admin/page.tsx - Código completo con mejoras visuales
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, Trophy, ArrowLeft, RefreshCw, Plus, Trash2, 
  Users, Calendar, Upload, Settings, UserPlus, Database,
  Sparkles, Shield, Crown, Star
} from "lucide-react"
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
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [newCandidate, setNewCandidate] = useState({
    nombre: "",
    apellido: "",
    grado: "",
    curso: "",
  })
  const [selectedGrado, setSelectedGrado] = useState("all")
  const [selectedCurso, setSelectedCurso] = useState("all")
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth())
  const [selectedAno, setSelectedAno] = useState(getCurrentYear().toString())
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [uploadSuccess, setUploadSuccess] = useState<string>("")

  // Cargar candidatos desde la API
  const loadCandidates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/candidates')
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
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar candidatos al montar el componente
  useEffect(() => {
    loadCandidates()
  }, [])

  // Redirección automática si no hay sesión
  useEffect(() => {
    if (status !== "loading" && !session) {
      const redirectTimer = setTimeout(() => {
        router.push('/auth/signin')
      }, 2000) // Esperar 2 segundos antes de redirigir

      return () => clearTimeout(redirectTimer)
    }
  }, [session, status, router])

  // Agregar candidato individual
  const addCandidate = async () => {
    if (!newCandidate.nombre || !newCandidate.apellido || !newCandidate.grado || !newCandidate.curso) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCandidate),
      })

      const data = await response.json()

      if (data.success) {
        // Agregar el nuevo candidato al estado local
        setCandidates(prev => [...prev, data.data])
        setNewCandidate({ nombre: "", apellido: "", grado: "", curso: "" })
        
        toast({
          title: "Candidato agregado",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al crear candidato",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al agregar candidato:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudo agregar el candidato",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Eliminar candidato
  const removeCandidate = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar estado local
        setCandidates(prev => prev.filter(candidate => candidate.id !== id))
        
        toast({
          title: "Candidato eliminado",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al eliminar candidato",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al eliminar candidato:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudo eliminar el candidato",
        variant: "destructive",
      })
    }
  }

  // Carga masiva desde Excel
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadSuccess("")

    try {
      const XLSX = await import("xlsx")

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          const candidatesToUpload = []

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[]
            if (row.length >= 3 && row[0] && row[1] && row[2]) {
              const nombreCompleto = row[0].toString().trim()
              const curso = row[1].toString().trim()
              const grado = row[2].toString().trim()

              const nombreParts = nombreCompleto.split(" ")
              const nombre = nombreParts[0] || ""
              const apellido = nombreParts.slice(1).join(" ") || ""

              if (nombre && apellido && curso && grado) {
                candidatesToUpload.push({
                  nombre,
                  apellido,
                  grado,
                  curso,
                })
              }
            }
          }

          if (candidatesToUpload.length > 0) {
            // Enviar a la API para carga masiva
            const response = await fetch('/api/candidates', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ candidates: candidatesToUpload }),
            })

            const result = await response.json()

            if (result.success) {
              // Recargar candidatos
              await loadCandidates()
              
              let message = `✅ ¡Carga exitosa! ${result.summary.created} candidatos creados`
              if (result.summary.duplicates > 0) {
                message += `, ${result.summary.duplicates} duplicados omitidos`
              }
              if (result.summary.errors > 0) {
                message += `, ${result.summary.errors} errores`
              }

              setUploadSuccess(message)
              setTimeout(() => setUploadSuccess(""), 7000)

              toast({
                title: "Carga completada",
                description: `${result.summary.created} candidatos agregados. ${result.summary.duplicates} duplicados omitidos.`,
              })
            } else {
              toast({
                title: "Error en carga masiva",
                description: result.message || "Error al procesar archivo Excel",
                variant: "destructive",
              })
            }
          } else {
            toast({
              title: "Sin datos válidos",
              description: "No se encontraron candidatos válidos en el archivo",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('Error al procesar Excel:', error)
          toast({
            title: "Error al procesar archivo",
            description: "Hubo un error al procesar el archivo Excel",
            variant: "destructive",
          })
        }
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error al cargar archivo:', error)
      toast({
        title: "Error",
        description: "Error al cargar el archivo",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  // Filtrar candidatos
  const filteredCandidates = candidates.filter((c) => {
    if (selectedGrado !== "all" && c.grado !== selectedGrado) return false
    if (selectedCurso !== "all" && c.curso !== selectedCurso) return false
    return true
  })

  const isFormValid = newCandidate.nombre && newCandidate.apellido && newCandidate.grado && newCandidate.curso

  // Loading state mejorado
  if (status === "loading" || isLoading) {
    return (
      <ThemeGradientBackground variant="blue">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in-up duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardContent className="pt-12 pb-8">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Cargando Panel de Administración
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Verificando permisos y cargando datos...
              </p>
            </CardContent>
          </Card>
        </div>
      </ThemeGradientBackground>
    )
  }

  // Authentication check mejorado
  if (!session) {
    return (
      <ThemeGradientBackground variant="warm">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in-up duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardContent className="pt-12 pb-8">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-600 rounded-full w-20 h-20 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Acceso No Autorizado
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Redirigiendo a la página de inicio de sesión...
              </p>
              <Button 
                onClick={() => router.push('/auth/signin')} 
                className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ir a Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeGradientBackground>
    )
  }

  return (
    <ThemeGradientBackground variant="blue">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header principal mejorado */}
          <Card className="animate-in fade-in-down duration-500 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader className="pb-8">
              <div className="space-y-6">
                {/* Título y descripción */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                        <Crown className="w-8 h-8 text-white animate-float" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Panel de Administración
                      </CardTitle>
                      <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                        Total: <span className="font-semibold text-blue-600 dark:text-blue-400">{candidates.length}</span> candidatos | 
                        Mostrando: <span className="font-semibold text-purple-600 dark:text-purple-400">{filteredCandidates.length}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={loadCandidates} 
                      variant="outline" 
                      size="sm" 
                      className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      disabled={isLoading}
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

                {/* Botones de navegación mejorados */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => window.location.href = "/admin/dashboard"} 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard Analytics
                  </Button>
                  <Button 
                    onClick={() => window.location.href = "/admin/periods"} 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Gestionar Períodos
                  </Button>
                  <Button 
                    onClick={() => window.location.href = `/results?mes=${selectedMes}&ano=${selectedAno}`} 
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Ver Resultados
                  </Button>
                </div>

                {/* Filtros mejorados */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Filtros de Búsqueda
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">🎓 Filtrar por Grado:</label>
                      <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                        <SelectTrigger className="transition-all duration-300 hover:shadow-md">
                          <SelectValue placeholder="Todos los grados" />
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
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">📚 Filtrar por Curso:</label>
                      <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                        <SelectTrigger className="transition-all duration-300 hover:shadow-md">
                          <SelectValue placeholder="Todos los cursos" />
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
                  </div>
                </div>

                {/* Carga masiva mejorada */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Carga Masiva desde Excel</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        Formato: Columna 1: Nombre y Apellido | Columna 2: Curso | Columna 3: Grado
                      </p>
                    </div>
                  </div>
                  
                  {uploadSuccess && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700 rounded-lg animate-in fade-in duration-300">
                      <p className="text-green-800 dark:text-green-200 font-medium text-sm break-words">{uploadSuccess}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      disabled={isUploading}
                      className="text-sm w-full sm:flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                      id="excel-upload"
                    />
                    <Button 
                      onClick={() => document.getElementById('excel-upload')?.click()}
                      disabled={isUploading}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all duration-300 hover:scale-105"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Procesando..." : "Seleccionar Archivo"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Sección principal de contenido */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Formulario para agregar candidato mejorado */}
            <Card className="animate-in slide-in-from-left duration-500 animation-delay-200 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800 dark:text-white">Agregar Nuevo Candidato</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      Todos los campos son obligatorios
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      👤 Nombre <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newCandidate.nombre}
                      onChange={(e) => setNewCandidate({ ...newCandidate, nombre: e.target.value })}
                      placeholder="Nombre del estudiante"
                      disabled={isSubmitting}
                      className="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      👤 Apellido <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newCandidate.apellido}
                      onChange={(e) => setNewCandidate({ ...newCandidate, apellido: e.target.value })}
                      placeholder="Apellido del estudiante"
                      disabled={isSubmitting}
                      className="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      🎓 Grado <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={newCandidate.grado}
                      onValueChange={(value) => setNewCandidate({ ...newCandidate, grado: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="transition-all duration-300 hover:shadow-md">
                        <SelectValue placeholder="Seleccionar grado" />
                      </SelectTrigger>
                      <SelectContent>
                        {grados.map((grado) => (
                          <SelectItem key={grado} value={grado}>
                            {grado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      📚 Curso <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={newCandidate.curso}
                      onValueChange={(value) => setNewCandidate({ ...newCandidate, curso: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="transition-all duration-300 hover:shadow-md">
                        <SelectValue placeholder="Seleccionar curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {cursos.map((curso) => (
                          <SelectItem key={curso} value={curso}>
                            {curso}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!isFormValid && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg animate-in fade-in duration-300">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Completa todos los campos para continuar
                    </p>
                  </div>
                )}

                <Button 
                  onClick={addCandidate} 
                  disabled={!isFormValid || isSubmitting} 
                  className={cn(
                    "w-full transition-all duration-300 hover:scale-105 hover:shadow-xl",
                    isFormValid 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" 
                      : "bg-gray-300 dark:bg-gray-700"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Candidato
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de candidatos mejorada */}
            <Card className="animate-in slide-in-from-right duration-500 animation-delay-400 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800 dark:text-white">Lista de Candidatos</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      {filteredCandidates.length} candidatos encontrados
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-12 animate-in fade-in duration-500">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-xl text-gray-500 dark:text-gray-400 mb-2 font-medium">
                        No hay candidatos para mostrar
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        {selectedGrado !== "all" || selectedCurso !== "all"
                          ? "Ajusta los filtros o agrega nuevos candidatos"
                          : "Agrega el primer candidato para comenzar"
                        }
                      </p>
                    </div>
                  ) : (
                    filteredCandidates.map((candidate, index) => (
                      <div
                        key={candidate.id}
                        className={cn(
                          "flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                          "animate-in slide-in-from-bottom duration-300",
                          "bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {candidate.nombre.charAt(0)}{candidate.apellido.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-lg text-gray-800 dark:text-white">
                              {candidate.nombre} {candidate.apellido}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge 
                                variant="outline" 
                                className="border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:bg-blue-900/20"
                              >
                                🎓 {candidate.grado}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                              >
                                📚 {candidate.curso}
                              </Badge>
                              {!candidate.active && (
                                <Badge 
                                  variant="destructive"
                                  className="animate-pulse"
                                >
                                  ⚠️ Inactivo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeCandidate(candidate.id)}
                          className="transition-all duration-300 hover:scale-110 hover:shadow-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas y mensaje inspiracional */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Estadísticas rápidas */}
            <Card className="animate-in slide-in-from-left duration-500 animation-delay-600 shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                  <BarChart3 className="w-5 h-5" />
                  Estadísticas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{candidates.length}</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Total Candidatos</p>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {candidates.filter(c => c.active).length}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-300 font-medium">Activos</p>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {new Set(candidates.map(c => c.grado)).size}
                    </p>
                    <p className="text-sm text-purple-800 dark:text-purple-300 font-medium">Grados</p>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {new Set(candidates.map(c => c.curso)).size}
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">Cursos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mensaje inspiracional */}
            <Card className="animate-in slide-in-from-right duration-500 animation-delay-800 shadow-xl border-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
                  <Crown className="w-8 h-8 text-yellow-500 animate-bounce" />
                  <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                  ¡Construyendo el Futuro!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Cada candidato que agregas es una oportunidad para reconocer la empatía y bondad en nuestra comunidad educativa. 
                  Gracias por ser parte de esta hermosa iniciativa.
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating theme toggle */}
        <div className="fixed bottom-6 right-6 animate-in slide-in-from-right duration-500 animation-delay-1000">
          <ThemeToggle />
        </div>
      </div>
    </ThemeGradientBackground>
  )
}