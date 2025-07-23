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
  CheckCircle, Clock, Users, Vote, AlertCircle, Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Cargando gestión de períodos...</p>
        </div>
      </div>
    )
  }

  // Authentication check
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>
              Solo los administradores pueden gestionar períodos de votación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/auth/signin"} className="w-full">
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activePeriod = periods.find(p => p.active)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-600" />
                  Gestión de Períodos de Votación
                </CardTitle>
                <CardDescription className="text-lg">
                  Administra cuándo los estudiantes pueden votar
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Período
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Período de Votación</DialogTitle>
                      <DialogDescription>
                        Configure las fechas y estado del nuevo período
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="mes">Mes</Label>
                          <Select value={newPeriod.mes} onValueChange={(value) => setNewPeriod(prev => ({ ...prev, mes: value }))}>
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
                          <Label htmlFor="ano">Año</Label>
                          <Input
                            id="ano"
                            type="number"
                            min="2020"
                            max="2030"
                            value={newPeriod.ano}
                            onChange={(e) => setNewPeriod(prev => ({ ...prev, ano: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="startDate">Fecha de Inicio</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newPeriod.startDate}
                          onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="endDate">Fecha de Fin</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newPeriod.endDate}
                          onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={newPeriod.active}
                          onCheckedChange={(checked) => setNewPeriod(prev => ({ ...prev, active: checked }))}
                        />
                        <Label htmlFor="active">Activar inmediatamente</Label>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={createPeriod} disabled={isCreating}>
                          {isCreating ? "Creando..." : "Crear Período"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button onClick={loadPeriods} variant="outline" size="default" disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                
                <Button onClick={() => window.location.href = "/admin"} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Estado actual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`${activePeriod ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'} text-white`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className={activePeriod ? "text-green-100" : "text-gray-100"}>
                    Estado Actual
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {activePeriod ? "ACTIVO" : "INACTIVO"}
                  </CardTitle>
                </div>
                {activePeriod ? (
                  <CheckCircle className="w-8 h-8 text-green-200" />
                ) : (
                  <Clock className="w-8 h-8 text-gray-200" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-sm ${activePeriod ? "text-green-100" : "text-gray-100"}`}>
                {activePeriod ? `${activePeriod.mes} ${activePeriod.ano}` : "Sin período activo"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-blue-100">Total Períodos</CardDescription>
                  <CardTitle className="text-2xl font-bold">{periods.length}</CardTitle>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-100">
                {periods.filter(p => p.active).length} activos
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-purple-100">Votos Totales</CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {periods.reduce((sum, p) => sum + p.stats.totalVotes, 0)}
                  </CardTitle>
                </div>
                <Vote className="w-8 h-8 text-purple-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-purple-100">
                Todos los períodos
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de períodos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Períodos de Votación Configurados
            </CardTitle>
            <CardDescription>
              Gestiona la activación y configuración de cada período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay períodos configurados
                </h3>
                <p className="text-gray-500 mb-4">
                  Crea tu primer período de votación para comenzar
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Período
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {periods.map((period) => (
                  <div key={period.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                          period.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {period.active ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Clock className="w-6 h-6" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {period.mes} {period.ano}
                            </h3>
                            <Badge variant={period.active ? "default" : "secondary"}>
                              {period.active ? "ACTIVO" : "INACTIVO"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(period.startDate).toLocaleDateString('es-ES')} - {new Date(period.endDate).toLocaleDateString('es-ES')}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Vote className="w-4 h-4" />
                              {period.stats.totalVotes} votos
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              {period.stats.candidatesWithVotes} candidatos
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => togglePeriod(period.id, period.active)}
                          variant={period.active ? "destructive" : "default"}
                          size="sm"
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
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Período activo - Los estudiantes pueden votar
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}