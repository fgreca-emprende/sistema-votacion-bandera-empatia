"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Heart, Users, Vote, LogOut } from "lucide-react"
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

interface PeriodStatus {
  success: boolean
  hasActivePeriod: boolean
  currentPeriod: {
    mes: string
    ano: string
    startDate: string
    endDate: string
  } | null
  periodStats?: {
    totalVotes: number
    totalCandidates: number
  }
  message: string
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [selectedGrado, setSelectedGrado] = useState("all")  
  const [selectedCurso, setSelectedCurso] = useState("all")
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth())
  const [selectedAno, setSelectedAno] = useState(getCurrentYear().toString())
  const [userType, setUserType] = useState<"student" | null>(null)
  const [periodStatus, setPeriodStatus] = useState<PeriodStatus | null>(null)
  const [isCheckingPeriod, setIsCheckingPeriod] = useState(true)
  const { toast } = useToast()

  // Agregar esta función para verificar períodos activos:
  const checkActivePeriod = async () => {
    try {
      setIsCheckingPeriod(true)
      const response = await fetch('/api/period-status')
      const data = await response.json()
      
      if (data.success) {
        setPeriodStatus(data)
      }
    } catch (error) {
      console.error('Error al verificar período activo:', error)
    } finally {
      setIsCheckingPeriod(false)
    }
  }

  // Agregar este useEffect para verificar el período al cargar:
  useEffect(() => {
    checkActivePeriod()
  }, [])

  const handleVotar = () => {
    if (!periodStatus?.hasActivePeriod) {
      toast({
        title: "Sin período activo",
        description: "No hay períodos de votación activos en este momento. Contacta al administrador.",
        variant: "destructive",
      })
      return
    }

    if (selectedGrado && selectedCurso && selectedMes && selectedAno) {
      window.location.href = `/voting?grado=${selectedGrado}&curso=${selectedCurso}&mes=${selectedMes}&ano=${selectedAno}`
    }
  }

  const handleAdminAccess = () => {
    if (session) {
      // Ya autenticado, ir a admin
      window.location.href = "/admin"
    } else {
      // Redirigir a login
      window.location.href = "/auth/signin"
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const isFormValid = selectedGrado !== "all" && selectedCurso !== "all" && selectedMes && selectedAno

  // Función helper para obtener el nombre de usuario
  const getUserDisplayName = () => {
    if (session?.user) {
      // Intentar obtener username, si no existe usar name o email
      return (session.user as any).username || 
             session.user.name || 
             session.user.email?.split('@')[0] || 
             'Administrador'
    }
    return 'Administrador'
  }

  // Si está autenticado como admin, mostrar panel admin
  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Panel de Administración</CardTitle>
            <CardDescription>
              Bienvenido, {getUserDisplayName()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => window.location.href = "/admin"} className="w-full h-12">
              <Users className="w-5 h-5 mr-2" />
              Gestionar Candidatos
            </Button>
            <Button onClick={() => window.location.href = "/results"} className="w-full h-12" variant="outline">
              <Vote className="w-5 h-5 mr-2" />
              Ver Resultados
            </Button>
            <Button onClick={handleSignOut} className="w-full" variant="ghost">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  {/* Alerta de período activo/inactivo */}
  {!isCheckingPeriod && periodStatus && (
    <div className="mb-4">
      {periodStatus.hasActivePeriod ? (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Período activo: {periodStatus.currentPeriod?.mes} {periodStatus.currentPeriod?.ano}
            </span>
          </div>
          {periodStatus.periodStats && (
            <div className="text-xs text-green-700 mt-1">
              {periodStatus.periodStats.totalVotes} votos registrados • {periodStatus.periodStats.totalCandidates} candidatos disponibles
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              No hay períodos de votación activos
            </span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            Las votaciones están deshabilitadas. Contacta al administrador para más información.
          </p>
        </div>
      )}
    </div>
  )}

  // Si está en modo estudiante, mostrar formulario de votación
  if (userType === "student") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">Preparar Votación</CardTitle>
            <CardDescription>Completa los datos para proceder a votar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

  // Pantalla principal - selección de tipo de usuario
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
          <Button onClick={handleAdminAccess} className="w-full h-12 text-lg" variant="outline">
            <Users className="w-5 h-5 mr-2" />
            Soy Administrador
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}