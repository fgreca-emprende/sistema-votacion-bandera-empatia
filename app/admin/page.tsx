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
  Users, Calendar, Upload, Settings // Agregar Calendar y Settings
} from "lucide-react"
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

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  // Authentication check - CON FIX DE REDIRECCIÓN
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>No autorizado. Redirigiendo a login...</p>
          <p className="text-sm text-gray-500 mt-2">
            Si no se redirige automáticamente, 
            <button 
              onClick={() => router.push('/auth/signin')} 
              className="text-blue-600 hover:underline ml-1"
            >
              haz clic aquí
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              {/* Header principal */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    Gestión de Candidatos
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Total: {candidates.length} candidatos | Mostrando: {filteredCandidates.length}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={loadCandidates} variant="outline" size="sm" className="w-full sm:w-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recargar
                  </Button>
                  <Button onClick={() => (window.location.href = "/")} variant="outline" className="w-full sm:w-auto">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {/* NUEVO: Botón Dashboard Analytics */}
                <Button 
                  onClick={() => window.location.href = "/admin/dashboard"} 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard Analytics
                </Button>
                {/* NUEVO: Botón Gestión de Períodos */}
                <Button 
                  onClick={() => window.location.href = "/admin/periods"} 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Gestionar Períodos
                </Button>
                {/* Botón Ver Resultados existente */}
                <Button 
                  onClick={() => window.location.href = `/results?mes=${selectedMes}&ano=${selectedAno}`} 
                  variant="outline"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Ver Resultados
                </Button>
                
                {/* Botón Volver existente */}
                <Button onClick={() => window.location.href = "/"} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </div>
            </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Filtrar por Grado:</label>
                  <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                    <SelectTrigger>
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

                <div>
                  <label className="text-sm font-medium">Filtrar por Curso:</label>
                  <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                    <SelectTrigger>
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
              </div>

              {/* Carga masiva - MEJORADA PARA MOBILE */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Carga Masiva desde Excel</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Formato: Columna 1: Nombre y Apellido | Columna 2: Curso | Columna 3: Grado
                </p>
                {uploadSuccess && (
                  <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                    <p className="text-green-800 font-medium text-sm break-words">{uploadSuccess}</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    disabled={isUploading}
                    className="text-sm w-full sm:flex-1"
                    id="excel-upload"
                  />
                  <Button 
                    onClick={() => document.getElementById('excel-upload')?.click()}
                    disabled={isUploading}
                    className="w-full sm:w-auto sm:min-w-[120px]"
                  >
                    {isUploading ? "Cargando..." : "Cargar Excel"}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Candidato</CardTitle>
              <CardDescription>Todos los campos son obligatorios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newCandidate.nombre}
                    onChange={(e) => setNewCandidate({ ...newCandidate, nombre: e.target.value })}
                    placeholder="Nombre del estudiante"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newCandidate.apellido}
                    onChange={(e) => setNewCandidate({ ...newCandidate, apellido: e.target.value })}
                    placeholder="Apellido del estudiante"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Grado <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={newCandidate.grado}
                    onValueChange={(value) => setNewCandidate({ ...newCandidate, grado: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
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
                <div>
                  <label className="text-sm font-medium">
                    Curso <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={newCandidate.curso}
                    onValueChange={(value) => setNewCandidate({ ...newCandidate, curso: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
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
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">Completa todos los campos para continuar</p>
                </div>
              )}

              <Button 
                onClick={addCandidate} 
                disabled={!isFormValid || isSubmitting} 
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isSubmitting ? "Agregando..." : "Agregar Candidato"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Candidatos</CardTitle>
              <CardDescription>
                {filteredCandidates.length} candidatos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay candidatos para mostrar</p>
                    <p className="text-sm text-gray-400">
                      {selectedGrado || selectedCurso 
                        ? "Ajusta los filtros o agrega candidatos"
                        : "Agrega el primer candidato"
                      }
                    </p>
                  </div>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {candidate.nombre} {candidate.apellido}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{candidate.grado}</Badge>
                            <Badge variant="secondary">{candidate.curso}</Badge>
                            {!candidate.active && (
                              <Badge variant="destructive">Inactivo</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeCandidate(candidate.id)}
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
      </div>
    </div>
  )
}