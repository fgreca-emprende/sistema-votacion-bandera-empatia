"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, Vote } from "lucide-react"
import AdminLogin from "@/components/admin-login"

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

export default function HomePage() {
  const [selectedGrado, setSelectedGrado] = useState("")
  const [selectedCurso, setSelectedCurso] = useState("")
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth())
  const [selectedAno, setSelectedAno] = useState(getCurrentYear().toString())
  const [userType, setUserType] = useState<"student" | "admin" | null>(null)
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  const handleVotar = () => {
    if (selectedGrado && selectedCurso && selectedMes && selectedAno) {
      window.location.href = `/voting?grado=${selectedGrado}&curso=${selectedCurso}&mes=${selectedMes}&ano=${selectedAno}`
    }
  }

  const handleAdmin = () => {
    window.location.href = "/admin"
  }

  const handleAdminLogin = (success: boolean) => {
    if (success) {
      setUserType("admin")
      setShowAdminLogin(false)
    }
  }

  const handleCancelLogin = () => {
    setShowAdminLogin(false)
    setUserType(null)
  }

  const isFormValid = selectedGrado && selectedCurso && selectedMes && selectedAno

  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} onCancel={handleCancelLogin} />
  }

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Bandera de la Empatía</CardTitle>
            <CardDescription>Sistema de votación escolar mensual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setUserType("student")} className="w-full h-12 text-lg" variant="default">
              <Vote className="w-5 h-5 mr-2" />
              Soy Estudiante
            </Button>
            <Button onClick={() => setShowAdminLogin(true)} className="w-full h-12 text-lg" variant="outline">
              <Users className="w-5 h-5 mr-2" />
              Soy Administrador
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userType === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Panel de Administración</CardTitle>
            <CardDescription>Bienvenido, Administrador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleAdmin} className="w-full h-12">
              Gestionar Candidatos
            </Button>
            <Button onClick={() => (window.location.href = "/results")} className="w-full h-12" variant="outline">
              Ver Resultados
            </Button>
            <Button onClick={() => setUserType(null)} className="w-full" variant="ghost">
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Bandera de la Empatía</CardTitle>
          <CardDescription>Selecciona todos los campos para votar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Mes: <span className="text-red-500">*</span>
              </label>
              <Select value={selectedMes} onValueChange={setSelectedMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona mes" />
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
              <label className="text-sm font-medium text-gray-700">
                Año: <span className="text-red-500">*</span>
              </label>
              <Select value={selectedAno} onValueChange={setSelectedAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona año" />
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Grado: <span className="text-red-500">*</span>
            </label>
            <Select value={selectedGrado} onValueChange={setSelectedGrado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu grado" />
              </SelectTrigger>
              <SelectContent>
                {grados.map((grado) => (
                  <SelectItem key={grado} value={grado}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{grado} grado</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Curso: <span className="text-red-500">*</span>
            </label>
            <Select value={selectedCurso} onValueChange={setSelectedCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos.map((curso) => (
                  <SelectItem key={curso} value={curso}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{curso}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isFormValid && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Atención:</strong> Todos los campos marcados con * son obligatorios
              </p>
            </div>
          )}

          <Button onClick={handleVotar} disabled={!isFormValid} className="w-full h-12 text-lg">
            <Vote className="w-5 h-5 mr-2" />
            Continuar a Votación
          </Button>

          <Button onClick={() => setUserType(null)} className="w-full" variant="ghost">
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
