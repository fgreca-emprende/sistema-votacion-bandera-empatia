// app/page.tsx - Código completo con mejoras visuales
"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, XCircle, Heart, Users, Vote, LogOut, ArrowLeft, 
  Shield, Crown, Sparkles, Star, Calendar, Clock, UserCheck, Settings
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

  // Verificar períodos activos
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
      return (session.user as any).username || 
             session.user.name || 
             session.user.email?.split('@')[0] || 
             'Administrador'
    }
    return 'Administrador'
  }

  // Panel de administración mejorado
  if (session) {
    return (
      <ThemeGradientBackground variant="blue">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in fade-in-up duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                  <Crown className="w-10 h-10 text-white animate-float" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Panel de Administración
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                Bienvenido, <span className="font-semibold text-blue-600 dark:text-blue-400">{getUserDisplayName()}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => window.location.href = "/admin"} 
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Users className="w-6 h-6 mr-3" />
                Gestionar Candidatos
              </Button>
              <Button 
                onClick={() => window.location.href = "/results"} 
                className="w-full h-14 text-lg bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Vote className="w-6 h-6 mr-3" />
                Ver Resultados
              </Button>
              <Button 
                onClick={handleSignOut} 
                className="w-full h-12 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transition-all duration-300 hover:scale-105"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Cerrar Sesión
              </Button>
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

  // Formulario de votación mejorado
  if (userType === "student") {
    return (
      <ThemeGradientBackground variant="purple">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-6">
            {/* Alerta de período activo/inactivo mejorada */}
            {!isCheckingPeriod && periodStatus && (
              <div className="animate-in slide-in-from-top duration-500">
                {periodStatus.hasActivePeriod ? (
                  <Card className="border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-200">
                            ✅ Período Activo: {periodStatus.currentPeriod?.mes} {periodStatus.currentPeriod?.ano}
                          </p>
                          {periodStatus.periodStats && (
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {periodStatus.periodStats.totalVotes} votos registrados • {periodStatus.periodStats.totalCandidates} candidatos disponibles
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-200">
                            ❌ No hay períodos de votación activos
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            Las votaciones están deshabilitadas. Contacta al administrador para más información.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Formulario principal mejorado */}
            <Card className="animate-in fade-in-up duration-500 animation-delay-200 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                  <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                    <Heart className="w-10 h-10 text-white animate-heartbeat" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Preparar Votación
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                  Completa todos los datos para proceder a votar por la Bandera de la Empatía
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selectores de período */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Mes <span className="text-red-500">*</span>
                    </label>
                    <Select value={selectedMes} onValueChange={setSelectedMes}>
                      <SelectTrigger className="h-12 transition-all duration-300 hover:shadow-md">
                        <SelectValue placeholder="Selecciona mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {meses.map((mes) => (
                          <SelectItem key={mes} value={mes}>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">📅</span>
                              {mes}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      Año <span className="text-red-500">*</span>
                    </label>
                    <Select value={selectedAno} onValueChange={setSelectedAno}>
                      <SelectTrigger className="h-12 transition-all duration-300 hover:shadow-md">
                        <SelectValue placeholder="Selecciona año" />
                      </SelectTrigger>
                      <SelectContent>
                        {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map((ano) => (
                          <SelectItem key={ano} value={ano.toString()}>
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600">📊</span>
                              {ano}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selectores de estudiante */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Grado <span className="text-red-500">*</span>
                    </label>
                    <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                      <SelectTrigger className="h-14 transition-all duration-300 hover:shadow-md">
                        <SelectValue placeholder="Selecciona tu grado" />
                      </SelectTrigger>
                      <SelectContent>
                        {grados.map((grado) => (
                          <SelectItem key={grado} value={grado}>
                            <div className="flex items-center gap-3 py-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">{grado.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium">{grado} grado</p>
                                <Badge variant="outline" className="text-xs">
                                  Primaria
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-orange-600" />
                      Curso <span className="text-red-500">*</span>
                    </label>
                    <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                      <SelectTrigger className="h-14 transition-all duration-300 hover:shadow-md">
                        <SelectValue placeholder="Selecciona tu curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {cursos.map((curso) => (
                          <SelectItem key={curso} value={curso}>
                            <div className="flex items-center gap-3 py-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">{curso.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium">{curso}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {curso === "Arrayan" ? "🌳" : curso === "Jacarandá" ? "🌸" : "🌺"} Curso
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mensaje de validación */}
                {!isFormValid && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-600 animate-pulse" />
                      <div>
                        <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
                          Campos requeridos
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                          Todos los campos marcados con * son obligatorios para continuar
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={handleVotar} 
                    disabled={!isFormValid} 
                    className={cn(
                      "w-full h-14 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl",
                      isFormValid 
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg" 
                        : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                    )}
                  >
                    <Vote className="w-6 h-6 mr-3" />
                    Continuar a Votación
                  </Button>

                  <Button 
                    onClick={() => setUserType(null)} 
                    className="w-full h-12 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transition-all duration-300 hover:scale-105"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                </div>
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

  // Pantalla principal mejorada - selección de tipo de usuario
  return (
    <ThemeGradientBackground variant="warm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Hero card principal */}
          <Card className="animate-in fade-in-up duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="relative mx-auto mb-6 w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                <div className="absolute inset-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse opacity-30"></div>
                <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 rounded-full w-24 h-24 flex items-center justify-center shadow-xl">
                  <Heart className="w-12 h-12 text-white animate-heartbeat" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                Bandera de la Empatía
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Sistema de votación escolar mensual para reconocer la bondad y empatía en nuestra comunidad educativa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setUserType("student")} 
                className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Vote className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Soy Estudiante</p>
                    <p className="text-sm opacity-90">Participa en la votación mensual</p>
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={handleAdminAccess} 
                className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Soy Administrador</p>
                    <p className="text-sm opacity-90">Gestiona candidatos y resultados</p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Card informativa adicional */}
          <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-300 shadow-xl border-0 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-pink-500 animate-pulse" />
                <Heart className="w-6 h-6 text-purple-500 animate-heartbeat" />
                <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                ¡Celebremos juntos la empatía!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Cada mes, reconocemos a aquellos compañeros que destacan por su bondad, 
                comprensión y actos de empatía hacia otros.
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