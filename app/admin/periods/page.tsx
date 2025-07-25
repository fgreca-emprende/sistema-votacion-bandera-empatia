// app/admin/periods/page.tsx - Código completo con mejoras visuales
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Calendar, Plus, Play, Pause, Trash2, ArrowLeft, RefreshCw, 
  CheckCircle, Clock, Users, Vote, AlertCircle, Settings,
  Crown, Sparkles, Star, Activity, TrendingUp, Shield
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle, ThemeGradientBackground } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const getCurrentYear = () => new Date().getFullYear()
const getCurrentMonth = () => meses[new Date().getMonth()]

interface VotingPeriod {
  id: string
  mes: string
  ano: string
  active: boolean
  startDate: string
  endDate: string
  createdAt: string
  stats: {
    totalVotes: number
    candidatesWithVotes: number
  }
}

interface NewPeriod {
  mes: string
  ano: string
  active: boolean
  startDate: string
  endDate: string
}

export default function PeriodsManagementPage() {
  const { data: session, status } = useSession()
  const [periods, setPeriods] = useState<VotingPeriod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPeriod, setNewPeriod] = useState<NewPeriod>({
    mes: getCurrentMonth(),
    ano: getCurrentYear().toString(),
    active: false,
    startDate: "",
    endDate: ""
  })
  const { toast } = useToast()

  // Cargar períodos desde la API
  const loadPeriods = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/voting-periods')
      const data = await response.json()

      if (data.success) {
        setPeriods(data.data)
      } else {
        throw new Error(data.message || 'Error al cargar períodos')
      }
    } catch (error) {
      console.error('Error cargando períodos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los períodos de votación",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Crear nuevo período
  const createPeriod = async () => {
    if (!newPeriod.startDate || !newPeriod.endDate) {
      toast({
        title: "Error",
        description: "Debe completar todas las fechas",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/voting-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mes: newPeriod.mes,
          ano: newPeriod.ano,
          active: newPeriod.active,
          startDate: new Date(newPeriod.startDate).toISOString(),
          endDate: new Date(newPeriod.endDate).toISOString(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadPeriods()
        setShowCreateDialog(false)
        setNewPeriod({
          mes: getCurrentMonth(),
          ano: getCurrentYear().toString(),
          active: false,
          startDate: "",
          endDate: ""
        })
        
        toast({
          title: "Período creado",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al crear período",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al crear período:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudo crear el período",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Activar/Desactivar período
  const togglePeriod = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/voting-periods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          active: !currentActive,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadPeriods()
        
        toast({
          title: "Estado actualizado",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al actualizar período",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error al actualizar período:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudo actualizar el período",
        variant: "destructive",
      })
    }
  }

  // Inicialización
  useEffect(() => {
    if (status === "authenticated") {
      loadPeriods()
    }
  }, [status])

  // Configurar fechas por defecto cuando cambie el mes/año
  useEffect(() => {
    if (newPeriod.mes && newPeriod.ano) {
      const monthIndex = meses.indexOf(newPeriod.mes)
      const year = parseInt(newPeriod.ano)
      
      // Primer día del mes
      const startDate = new Date(year, monthIndex, 1)
      // Último día del mes
      const endDate = new Date(year, monthIndex + 1, 0)
      
      setNewPeriod(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }))
    }
  }, [newPeriod.mes, newPeriod.ano])

  // Loading state mejorado
  if (status === "loading" || isLoading) {
    return (
      <ThemeGradientBackground variant="purple">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Cargando Gestión de Períodos
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Verificando permisos y cargando configuración...
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
            <CardHeader className="pb-8">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-600 rounded-full w-20 h-20 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Acceso Restringido
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                Solo los administradores pueden gestionar períodos de votación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = "/auth/signin"} 
                className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white transition-all duration-300 hover:scale-105"
              >
                <Shield className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeGradientBackground>
    )
  }

  const activePeriod = periods.find(p => p.active)

  return (
    <ThemeGradientBackground variant="purple">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header mejorado */}
          <Card className="animate-in fade-in-down duration-500 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader className="pb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full animate-pulse opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                      <Calendar className="w-8 h-8 text-white animate-float" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Gestión de Períodos de Votación
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                      Administra cuándo los estudiantes pueden participar en las votaciones
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Período
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          Crear Nuevo Período de Votación
                        </DialogTitle>
                        <DialogDescription>
                          Configure las fechas y estado del nuevo período de votación
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mes" className="text-sm font-semibold flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              Mes
                            </Label>
                            <Select value={newPeriod.mes} onValueChange={(value) => setNewPeriod(prev => ({ ...prev, mes: value }))}>
                              <SelectTrigger className="transition-all duration-300 hover:shadow-md">
                                <SelectValue />
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
                          <div className="space-y-2">
                            <Label htmlFor="ano" className="text-sm font-semibold flex items-center gap-2">
                              <Clock className="w-4 h-4 text-purple-600" />
                              Año
                            </Label>
                            <Input
                              id="ano"
                              type="number"
                              min="2020"
                              max="2030"
                              value={newPeriod.ano}
                              onChange={(e) => setNewPeriod(prev => ({ ...prev, ano: e.target.value }))}
                              className="transition-all duration-300 hover:shadow-md"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="startDate" className="text-sm font-semibold flex items-center gap-2">
                            <Play className="w-4 h-4 text-green-600" />
                            Fecha de Inicio
                          </Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newPeriod.startDate}
                            onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                            className="transition-all duration-300 hover:shadow-md"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="endDate" className="text-sm font-semibold flex items-center gap-2">
                            <Pause className="w-4 h-4 text-red-600" />
                            Fecha de Fin
                          </Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newPeriod.endDate}
                            onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                            className="transition-all duration-300 hover:shadow-md"
                          />
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                          <Switch
                            id="active"
                            checked={newPeriod.active}
                            onCheckedChange={(checked) => setNewPeriod(prev => ({ ...prev, active: checked }))}
                          />
                          <Label htmlFor="active" className="flex items-center gap-2 font-medium">
                            <Activity className="w-4 h-4 text-purple-600" />
                            Activar inmediatamente
                          </Label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCreateDialog(false)}
                            className="transition-all duration-300 hover:scale-105"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={createPeriod} 
                            disabled={isCreating}
                            className={cn(
                              "transition-all duration-300 hover:scale-105",
                              isCreating 
                                ? "bg-gray-400" 
                                : "bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                            )}
                          >
                            {isCreating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creando...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Crear Período
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    onClick={loadPeriods} 
                    variant="outline" 
                    disabled={isLoading}
                    className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                    Actualizar
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = "/admin"} 
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

          {/* Cards de estado mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-200">
            <Card className={cn(
              "transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0",
              activePeriod 
                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
                : "bg-gradient-to-br from-gray-500 to-gray-600 text-white"
            )}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className={activePeriod ? "text-green-100" : "text-gray-100"}>
                      Estado Actual
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold">
                      {activePeriod ? "ACTIVO" : "INACTIVO"}
                    </CardTitle>
                  </div>
                  <div className="relative">
                    {activePeriod ? (
                      <>
                        <div className="absolute inset-0 bg-green-300 rounded-full animate-ping opacity-30"></div>
                        <CheckCircle className="relative w-12 h-12 text-green-200" />
                      </>
                    ) : (
                      <Clock className="w-12 h-12 text-gray-200" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={cn("text-sm font-medium", activePeriod ? "text-green-100" : "text-gray-100")}>
                  {activePeriod ? `${activePeriod.mes} ${activePeriod.ano}` : "Sin período activo"}
                </div>
                {activePeriod && (
                  <div className="text-xs text-green-200 mt-1">
                    {activePeriod.stats.totalVotes} votos registrados
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-blue-100">Total Períodos</CardDescription>
                    <CardTitle className="text-3xl font-bold">{periods.length}</CardTitle>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-300 rounded-full animate-pulse opacity-30"></div>
                    <Calendar className="relative w-12 h-12 text-blue-200" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-blue-100">
                  {periods.filter(p => p.active).length} activos • {periods.filter(p => !p.active).length} inactivos
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-purple-100">Votos Totales</CardDescription>
                    <CardTitle className="text-3xl font-bold">
                      {periods.reduce((sum, p) => sum + p.stats.totalVotes, 0)}
                    </CardTitle>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-300 rounded-full animate-pulse opacity-30"></div>
                    <Vote className="relative w-12 h-12 text-purple-200" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-purple-100">
                  Todos los períodos registrados
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de períodos mejorada */}
          <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-400 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-800 dark:text-white">
                    Períodos de Votación Configurados
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Gestiona la activación y configuración de cada período
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <div className="text-center py-16 animate-in fade-in duration-500">
                  <div className="relative mx-auto mb-6 w-24 h-24">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-full"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-full flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    No hay períodos configurados
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
                    Crea tu primer período de votación para comenzar a gestionar las elecciones
                  </p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Período
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {periods.map((period, index) => (
                    <div 
                      key={period.id} 
                      className={cn(
                        "p-6 border-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                        "animate-in slide-in-from-bottom duration-300",
                        period.active 
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700"
                          : "bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                            period.active 
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" 
                              : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                          )}>
                            {period.active ? (
                              <CheckCircle className="w-8 h-8" />
                            ) : (
                              <Clock className="w-8 h-8" />
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {period.mes} {period.ano}
                              </h3>
                              <Badge 
                                variant={period.active ? "default" : "secondary"}
                                className={cn(
                                  "px-3 py-1 font-semibold",
                                  period.active && "bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-pulse"
                                )}
                              >
                                {period.active ? "ACTIVO" : "INACTIVO"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              📅 {new Date(period.startDate).toLocaleDateString('es-ES')} - {new Date(period.endDate).toLocaleDateString('es-ES')}
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <Vote className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-semibold text-blue-700 dark:text-blue-300">
                                  {period.stats.totalVotes} votos
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-semibold text-purple-700 dark:text-purple-300">
                                  {period.stats.candidatesWithVotes} candidatos
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => togglePeriod(period.id, period.active)}
                            variant={period.active ? "destructive" : "default"}
                            size="sm"
                            className={cn(
                              "transition-all duration-300 hover:scale-110 hover:shadow-lg",
                              period.active 
                                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" 
                                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            )}
                          >
                            {period.active ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Activar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {period.active && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700 rounded-xl animate-in fade-in duration-300">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-800 dark:text-green-200">
                                ✅ Período activo - Los estudiantes pueden votar
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-300">
                                Este período está disponible para recibir votaciones de la comunidad estudiantil
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card informativa adicional */}
          <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-600 shadow-xl border-0 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
                <Crown className="w-8 h-8 text-purple-500 animate-bounce" />
                <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                ¡Gestiona la Participación Estudiantil!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Los períodos de votación son el corazón del sistema Bandera de la Empatía. 
                Configura cuándo los estudiantes pueden participar y reconocer la bondad en su comunidad.
              </p>
              
              {/* Tips útiles */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      Consejo de Activación
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Solo puede haber un período activo a la vez. Al activar uno nuevo, los demás se desactivan automáticamente.
                  </p>
                </div>
                
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      Seguimiento de Estadísticas
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Cada período registra automáticamente el número de votos y candidatos participantes.
                  </p>
                </div>
              </div>
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