"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Users, ArrowLeft, Calendar } from "lucide-react"
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
}

export default function AdminPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [newCandidate, setNewCandidate] = useState({
    nombre: "",
    apellido: "",
    grado: "",
    curso: "",
  })
  const [selectedGrado, setSelectedGrado] = useState("")
  const [selectedCurso, setSelectedCurso] = useState("")
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth())
  const [selectedAno, setSelectedAno] = useState(getCurrentYear().toString())
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const [uploadSuccess, setUploadSuccess] = useState<string>("")

  const removeCandidate = (id: string) => {
    const updatedCandidates = candidates.filter((candidate) => candidate.id !== id)
    saveCandidates(updatedCandidates)
    toast({
      title: "Candidato eliminado",
      description: `El candidato ha sido eliminado exitosamente`,
    })
  }

  useEffect(() => {
    const saved = localStorage.getItem("empathy-candidates")
    if (saved) {
      setCandidates(JSON.parse(saved))
    }
  }, [])

  const saveCandidates = (newCandidates: Candidate[]) => {
    setCandidates(newCandidates)
    localStorage.setItem("empathy-candidates", JSON.stringify(newCandidates))
  }

  const checkDuplicate = (nombre: string, apellido: string, grado: string, curso: string) => {
    return candidates.some(
      (candidate) =>
        candidate.nombre.toLowerCase() === nombre.toLowerCase() &&
        candidate.apellido.toLowerCase() === apellido.toLowerCase() &&
        candidate.grado === grado &&
        candidate.curso === curso,
    )
  }

  const addCandidate = () => {
    if (!newCandidate.nombre || !newCandidate.apellido || !newCandidate.grado || !newCandidate.curso) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    if (checkDuplicate(newCandidate.nombre, newCandidate.apellido, newCandidate.grado, newCandidate.curso)) {
      toast({
        title: "Candidato duplicado",
        description: `${newCandidate.nombre} ${newCandidate.apellido} ya existe en ${newCandidate.grado} - ${newCandidate.curso}`,
        variant: "destructive",
      })
      return
    }

    const candidate: Candidate = {
      id: Date.now().toString(),
      ...newCandidate,
    }

    saveCandidates([...candidates, candidate])
    setNewCandidate({ nombre: "", apellido: "", grado: "", curso: "" })

    toast({
      title: "Candidato agregado",
      description: `${candidate.nombre} ${candidate.apellido} ha sido agregado exitosamente`,
    })
  }

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const XLSX = await import("xlsx")

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          const newCandidates: Candidate[] = []
          const duplicates: string[] = []
          const errors: string[] = []

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
                // Verificar duplicados
                if (checkDuplicate(nombre, apellido, grado, curso)) {
                  duplicates.push(`${nombre} ${apellido} (${grado} - ${curso})`)
                } else {
                  newCandidates.push({
                    id: `${Date.now()}-${i}`,
                    nombre,
                    apellido,
                    grado,
                    curso,
                  })
                }
              } else {
                errors.push(`Fila ${i + 1}: Datos incompletos`)
              }
            }
          }

          if (newCandidates.length > 0) {
            saveCandidates([...candidates, ...newCandidates])
            let message = `✅ ¡Carga exitosa! Se agregaron ${newCandidates.length} candidatos`

            if (duplicates.length > 0) {
              message += `. Se omitieron ${duplicates.length} duplicados`
            }

            if (errors.length > 0) {
              message += `. ${errors.length} filas con errores`
            }

            setUploadSuccess(message)
            setTimeout(() => setUploadSuccess(""), 7000)

            toast({
              title: "Carga completada",
              description: `${newCandidates.length} candidatos agregados. ${duplicates.length} duplicados omitidos.`,
            })
          } else {
            toast({
              title: "Sin datos nuevos",
              description: "No se encontraron candidatos nuevos para agregar",
              variant: "destructive",
            })
          }
        } catch (error) {
          toast({
            title: "Error al procesar archivo",
            description: "Hubo un error al procesar el archivo Excel",
            variant: "destructive",
          })
        }
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
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

  const filteredCandidates = candidates.filter((c) => {
    if (selectedGrado && c.grado !== selectedGrado) return false
    if (selectedCurso && c.curso !== selectedCurso) return false
    return true
  })

  const isFormValid = newCandidate.nombre && newCandidate.apellido && newCandidate.grado && newCandidate.curso

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Gestión de Candidatos
                </CardTitle>
                <CardDescription>Administra los candidatos para la votación Bandera de la Empatía</CardDescription>

                {/* Filtros de Mes y Año */}
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Período de Votación
                  </h3>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm font-medium">Mes:</label>
                      <Select value={selectedMes} onValueChange={setSelectedMes}>
                        <SelectTrigger className="w-32">
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
                        <SelectTrigger className="w-24">
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

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Carga Masiva desde Excel</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Formato: Columna 1: Nombre y Apellido | Columna 2: Curso | Columna 3: Grado
                  </p>
                  {uploadSuccess && (
                    <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                      <p className="text-green-800 font-medium">{uploadSuccess}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      disabled={isUploading}
                      className="text-sm"
                      id="excel-upload"
                    />
                    <label htmlFor="excel-upload" className="cursor-pointer">
                      <Button asChild disabled={isUploading}>
                        <span>{isUploading ? "Cargando..." : "Cargar Excel"}</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
              <Button onClick={() => (window.location.href = "/")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
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
                  <p className="text-yellow-800 text-sm">Completa todos los campos obligatorios (*)</p>
                </div>
              )}

              <Button onClick={addCandidate} disabled={!isFormValid} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Candidato
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filtrar Candidatos</CardTitle>
              <div className="flex gap-2">
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
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCandidates.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay candidatos registrados</p>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {candidate.nombre} {candidate.apellido}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{candidate.grado}</Badge>
                          <Badge variant="secondary">{candidate.curso}</Badge>
                        </div>
                      </div>
                      <Button onClick={() => removeCandidate(candidate.id)} variant="destructive" size="sm">
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
