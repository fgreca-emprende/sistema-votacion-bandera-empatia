// app/page.tsx - Homepage optimizada con lazy loading
"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle, XCircle, Heart, Users, Vote, LogOut, ArrowLeft, 
  Shield, Crown, Sparkles, Star, Calendar, Clock, UserCheck, Settings,
  Trophy
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle, ThemeGradientBackground } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"
import { usePeriodStatus } from "@/hooks/use-periods"
import { useLazyNavigation } from "@/components/admin/lazy-admin-components"

const grados = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const cursos = ["Arrayan", "Jacarandá", "Ceibo"]
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const getCurrentYear = () => new Date().getFullYear()
const getCurrentMonth = () => meses[new Date().getMonth()]

export default function HomePage() {
  const { data: session, status } = useSession()
  const [selectedGrado, setSelectedGrado] = useState("all")  
  const [selectedCurso, setSelectedCurso] = useState("all")
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth())
  const [selectedAno, setSelectedAno] = useState(getCurrentYear().toString())
  const [userType, setUserType] = useState<"student" | null>(null)
  const { toast } = useToast()

  // Hooks optimizados
  const {
    data: periodStatus,
    isLoading: isCheckingPeriod,
    error: periodError,
    refetch: refetchPeriodStatus,
  } = usePeriodStatus()

  const {
    navigateToAdmin,
    navigateToDashboard,
    navigateToPeriods,
    navigateToResults
  } = useLazyNavigation()

  // Función de votación con lazy loading
  const handleVotar = () => {
    if (!periodStatus?.hasActivePeriod) {
      toast({
        title: "Sin período activo",
        description: "No hay períodos de votación activos en este momento. Contacta al administrador.",
        variant: "destructive",
      })
      return
    }

    if (selectedGrado === "all" || selectedCurso === "all") {
      toast({
        title: "Selección incompleta",
        description: "Por favor selecciona tu grado y curso antes de continuar",
        variant: "destructive",
      })
      return
    }

    const currentPeriod = periodStatus.currentPeriod
    if (!currentPeriod) {
      toast({
        title: "Error de período",
        description: "No se pudo obtener la información del período activo",
        variant: "destructive",
      })
      return
    }

    // Precargar página de votación antes de navegar
    import('@/app/voting/page').then(() => {
      const votingUrl = `/voting?grado=${selectedGrado}&curso=${selectedCurso}&mes=${currentPeriod.mes}&ano=${currentPeriod.ano}`
      window.location.href = votingUrl
    }).catch(() => {
      // Fallback sin preload
      const votingUrl = `/voting?grado=${selectedGrado}&curso=${selectedCurso}&mes=${currentPeriod.mes}&ano=${currentPeriod.ano}`
      window.location.href = votingUrl
    })
  }

  const handleVerResultados = () => {
    const params = new URLSearchParams()
    if (selectedMes !== getCurrentMonth()) params.append("mes", selectedMes)
    if (selectedAno !== getCurrentYear().toString()) params.append("ano", selectedAno)
    if (selectedGrado !== "all") params.append("grado", selectedGrado)
    if (selectedCurso !== "all") params.append("curso", selectedCurso)

    navigateToResults(params.toString())
  }

  // Precargar componentes administrativos cuando el usuario es admin
  useEffect(() => {
    if (status === "authenticated") {
      // Precargar componentes admin en idle time
      requestIdleCallback(() => {
        import('@/app/admin/dashboard/page').catch(() => {})
        import('@/app/admin/periods/page').catch(() => {})
      })
    }
  }, [status])

  // Loading de autenticación
  if (status === "loading") {
    return (
      <ThemeGradientBackground variant="purple">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in duration-500">
            <CardContent className="p-8">
              <div className="relative mx-auto mb-6 w-16 h-16">
                <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Cargando sistema...
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Verificando acceso al sistema
              </p>
            </CardContent>
          </Card>
        </div>
      </ThemeGradientBackground>
    )
  }

  // Panel de administrador con navegación lazy
  if (status === "authenticated") {
    return (
      <ThemeGradientBackground variant="purple">
        <div className="min-h-screen p-4">
          <div className="max-w-6xl mx-auto">
            {/* Header Admin */}
            <div className="flex justify-between items-center mb-8 animate-in fade-in duration-500">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full animate-pulse opacity-30"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    Panel de Administración
                  </h1>
                  <p className="text-white/80 text-lg">
                    Bienvenido, {session.user?.name || 'Administrador'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button 
                  onClick={() => signOut()}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>

            {/* Estado del sistema */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Estado del período */}
              <Card className="animate-in slide-in-from-left duration-500 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    Estado del Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isCheckingPeriod ? (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Verificando...
                    </div>
                  ) : periodError ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        Error al verificar
                      </div>
                      <Button 
                        onClick={() => refetchPeriodStatus()}
                        size="sm"
                        variant="outline"
                      >
                        Reintentar
                      </Button>
                    </div>
                  ) : periodStatus?.hasActivePeriod ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Período Activo</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><strong>Período:</strong> {periodStatus.currentPeriod?.mes} {periodStatus.currentPeriod?.ano}</p>
                        {periodStatus.periodStats && (
                          <>
                            <p><strong>Votos:</strong> {periodStatus.periodStats.totalVotes}</p>
                            <p><strong>Candidatos:</strong> {periodStatus.periodStats.totalCandidates}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">Sin período activo</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Acceso rápido a gestión */}
              <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-200 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Settings className="w-6 h-6 text-purple-600" />
                    Gestión Rápida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={navigateToPeriods}
                    className="w-full justify-start"
                    variant="ghost"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Gestionar Períodos
                  </Button>
                  <Button 
                    onClick={navigateToAdmin}
                    className="w-full justify-start"
                    variant="ghost"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Gestionar Candidatos
                  </Button>
                  <Button 
                    onClick={navigateToDashboard}
                    className="w-full justify-start"
                    variant="ghost"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Dashboard Avanzado
                  </Button>
                </CardContent>
              </Card>

              {/* Vista de resultados admin */}
              <Card className="animate-in slide-in-from-right duration-500 animation-delay-400 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                    Vista de Resultados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={selectedMes} onValueChange={setSelectedMes}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {meses.map((mes) => (
                            <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedAno} onValueChange={setSelectedAno}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          {[getCurrentYear(), getCurrentYear() - 1].map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleVerResultados}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                      size="sm"
                    >
                      Ver Resultados
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navegación principal con lazy loading */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Gestión de Candidatos",
                  description: "Administrar candidatos del sistema",
                  icon: Users,
                  onClick: navigateToAdmin,
                  gradient: "from-blue-500 to-purple-600",
                },
                {
                  title: "Períodos de Votación", 
                  description: "Configurar períodos activos",
                  icon: Calendar,
                  onClick: navigateToPeriods,
                  gradient: "from-green-500 to-emerald-600",
                },
                {
                  title: "Dashboard Avanzado",
                  description: "Analytics y métricas detalladas",
                  icon: Crown,
                  onClick: navigateToDashboard, 
                  gradient: "from-purple-500 to-pink-600",
                },
              ].map((item, index) => (
                <Card 
                  key={item.title}
                  className={cn(
                    "group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
                    "animate-in slide-in-from-bottom duration-500"
                  )}
                  style={{ animationDelay: `${(index + 1) * 150}ms` }}
                  onClick={item.onClick}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-r shadow-lg group-hover:scale-110 transition-transform duration-300",
                        item.gradient
                      )}>
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ThemeGradientBackground>
    )
  }

  // Vista pública para estudiantes
  return (
    <ThemeGradientBackground variant="default">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-in fade-in duration-500">
            <div className="flex justify-end mb-6">
              <ThemeToggle />
            </div>
            
            {!userType ? (
              /* Pantalla de bienvenida */
              <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <CardHeader className="text-center py-12">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse opacity-30"></div>
                      <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 rounded-full w-24 h-24 flex items-center justify-center shadow-xl">
                        <Heart className="w-12 h-12 text-white animate-heartbeat" />
                      </div>
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
                    onClick={handleVerResultados}
                    variant="outline" 
                    className="w-full h-16 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 group"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">Ver Resultados</p>
                        <p className="text-sm opacity-75">Consulta los ganadores</p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Formulario de votación */
              <div className="space-y-8">
                <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm animate-in slide-in-from-top duration-500">
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Button 
                        onClick={() => setUserType(null)}
                        variant="ghost" 
                        size="sm"
                        className="absolute left-6 top-6"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Atrás
                      </Button>
                      <UserCheck className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      Información del Estudiante
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      Selecciona tu grado y curso para continuar con la votación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Estado del período con React Query */}
                    {isCheckingPeriod ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Verificando período de votación...
                      </div>
                    ) : periodError ? (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                          <XCircle className="w-5 h-5" />
                          <span className="font-semibold">Error al verificar período</span>
                        </div>
                        <p className="text-sm text-red-600 mb-3">No se pudo verificar si hay períodos activos</p>
                        <Button 
                          onClick={() => refetchPeriodStatus()}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : periodStatus?.hasActivePeriod ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Período de votación activo</span>
                        </div>
                        <p className="text-sm text-green-600">
                          {periodStatus.currentPeriod?.mes} {periodStatus.currentPeriod?.ano} - Puedes votar hasta el{' '}
                          {periodStatus.currentPeriod?.endDate ? 
                            new Date(periodStatus.currentPeriod.endDate).toLocaleDateString('es-ES') : 'fin del período'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                          <Clock className="w-5 h-5" />
                          <span className="font-semibold">Sin período activo</span>
                        </div>
                        <p className="text-sm text-orange-600">
                          No hay períodos de votación activos en este momento. Contacta al administrador.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="grado" className="text-sm font-semibold">Grado</Label>
                        <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu grado" />
                          </SelectTrigger>
                          <SelectContent>
                            {grados.map((grado) => (
                              <SelectItem key={grado} value={grado}>{grado}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="curso" className="text-sm font-semibold">Curso</Label>
                        <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {cursos.map((curso) => (
                              <SelectItem key={curso} value={curso}>{curso}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                      <Button
                        onClick={handleVotar}
                        disabled={
                          selectedGrado === "all" || 
                          selectedCurso === "all" || 
                          !periodStatus?.hasActivePeriod ||
                          isCheckingPeriod
                        }
                        size="lg"
                        className={cn(
                          "w-full h-14 text-lg font-semibold transition-all duration-300",
                          (selectedGrado === "all" || selectedCurso === "all" || !periodStatus?.hasActivePeriod) 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:scale-105 hover:shadow-xl"
                        )}
                      >
                        <Vote className="w-6 h-6 mr-3" />
                        {isCheckingPeriod ? "Verificando..." : "Ir a Votar"}
                      </Button>

                      <Button
                        onClick={handleVerResultados}
                        variant="outline"
                        size="lg"
                        className="w-full h-14 text-lg font-semibold border-2 transition-all duration-300 hover:scale-105"
                      >
                        <Trophy className="w-6 h-6 mr-3" />
                        Ver Resultados
                      </Button>
                    </div>

                    {(selectedGrado === "all" || selectedCurso === "all") && (
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Completa tu información para poder votar
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500 animation-delay-300">
                  <Card className="border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        ¿Cómo votar?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>1. Selecciona tu grado y curso</p>
                      <p>2. Haz clic en "Ir a Votar"</p>
                      <p>3. Elige al compañero más empático</p>
                      <p>4. ¡Confirma tu voto!</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <Heart className="w-6 h-6 text-pink-600" />
                        Sobre la Empatía
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                      <p>
                        Reconocemos a quienes demuestran bondad, comprensión y apoyo hacia sus compañeros,
                        creando un ambiente escolar más inclusivo y empático.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeGradientBackground>
  )
}