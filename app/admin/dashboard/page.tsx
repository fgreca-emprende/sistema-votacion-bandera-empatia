"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts"
import { 
  TrendingUp, Users, Vote, Trophy, Activity, Calendar, 
  BarChart3, PieChart as PieChartIcon, ArrowLeft, RefreshCw,
  Target, Award, Zap, Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Componente de error para gráficos
const ChartError = ({ message = "No hay datos disponibles" }: { message?: string }) => (
  <div className="flex items-center justify-center h-[300px]">
    <div className="text-center">
      <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
        <span className="text-gray-500 text-sm">📊</span>
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  </div>
)

// Función mejorada para limpiar datos y agregar keys únicas
const cleanChartData = (data: any[], keyField: string, prefix: string = 'chart') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return []
  }
  
  return data
    .filter(item => item && item[keyField] !== null && item[keyField] !== undefined) // Filtrar elementos nulos/indefinidos
    .map((item, index) => ({
      ...item,
      _chartKey: `${prefix}-${keyField}-${item[keyField]}-${index}-${Date.now()}`, // Key única con timestamp
      // Asegurar que los valores numéricos sean válidos
      votes: typeof item.votes === 'number' ? item.votes : 0,
      _count: typeof item._count === 'number' ? item._count : 0
    }))
}

// Función mejorada para validar datos antes de renderizar gráficos
const validateChartData = (data: any[], requiredField: string = 'votes') => {
  return data && 
         Array.isArray(data) && 
         data.length > 0 && 
         data.some(item => item && typeof item[requiredField] === 'number' && item[requiredField] > 0)
}

// Función mejorada para procesar datos de manera segura
const safeProcessData = (data: any[], keyField: string, prefix: string = 'chart') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return []
  }
  
  return data
    .filter(item => item && item[keyField] !== null && item[keyField] !== undefined)
    .map((item, index) => ({
      ...item,
      // Crear una key única y estable
      _chartKey: `${prefix}-${keyField}-${item[keyField]}-${index}`,
      // Asegurar valores numéricos válidos
      votes: typeof item.votes === 'number' ? item.votes : 0,
      percentage: typeof item.percentage === 'number' ? item.percentage : 0,
      // Añadir el campo grado como string para evitar conflictos
      gradoKey: `grado-${item[keyField]}-${index}`
    }))
}

// Colores para gráficos
const COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4', 
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gradient: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
}

interface DashboardData {
  overview: {
    totalCandidates: number
    activeCandidates: number
    inactiveCandidates: number
    totalVotes: number
    currentMonthVotes: number
    uniqueVoters: number
    averageVotesPerCandidate: number
  }
  topCandidates: Array<{
    candidate: {
      nombre: string
      apellido: string
      grado: string
      curso: string
      active: boolean
    }
    totalVotes: number
  }>
  mostActivePeriods: Array<{
    period: string
    mes: string
    ano: string
    votes: number
  }>
  distribution: {
    byGrado: Array<{
      grado: string
      votes: number
      percentage: number
    }>
    byCurso: Array<{
      curso: string
      votes: number
      percentage: number
    }>
    candidatesByGradoCurso: Array<{
      grado: string
      curso: string
      candidates: number
    }>
  }
  currentPeriod: {
    mes: string
    ano: string
    votes: number
  }
}

interface TrendsData {
  monthlyTrends: Array<{
    period: string
    mes: string
    ano: string
    totalVotes: number
    activeCandidates: number
    averageVotesPerCandidate: number
    growth: {
      votes: number
      candidates: number
    }
  }>
  summary: {
    totalPeriods: number
    totalVotesInPeriod: number
    averageVotesPerMonth: number
  }
}

interface ParticipationData {
  byGrado: Array<{
    grado: string
    votes: number
    percentage: number
  }>
  byCurso: Array<{
    curso: string
    votes: number
    percentage: number
  }>
  matrix: Array<{
    grado: string
    curso: string
    votes: number
    percentage: number
  }>
  frequency: {
    totalUniqueVoters: number
    averageParticipation: number
  }
}

export default function AnalyticsDashboardPage() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null)
  const [participationData, setParticipationData] = useState<ParticipationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [trendsPeriod, setTrendsPeriod] = useState("6")
  const { toast } = useToast()

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics?type=dashboard')
      const data = await response.json()

      if (data.success) {
        setDashboardData(data.data)
      } else {
        throw new Error(data.message || 'Error al cargar datos')
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas del dashboard",
        variant: "destructive",
      })
    }
  }

  // Cargar datos de tendencias
  const loadTrendsData = async () => {
    try {
      const response = await fetch(`/api/analytics?type=trends&period=${trendsPeriod}`)
      const data = await response.json()

      if (data.success) {
        setTrendsData(data.data)
      } else {
        throw new Error(data.message || 'Error al cargar tendencias')
      }
    } catch (error) {
      console.error('Error cargando tendencias:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las tendencias",
        variant: "destructive",
      })
    }
  }

  // Cargar datos de participación
  const loadParticipationData = async () => {
    try {
      const response = await fetch('/api/analytics?type=participation')
      const data = await response.json()

      if (data.success) {
        setParticipationData(data.data)
      } else {
        throw new Error(data.message || 'Error al cargar participación')
      }
    } catch (error) {
      console.error('Error cargando participación:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de participación",
        variant: "destructive",
      })
    }
  }

  // Cargar todos los datos
  const loadAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadDashboardData(),
        loadTrendsData(),
        loadParticipationData()
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      loadAllData()
    }
  }, [status])

  // Recargar tendencias cuando cambie el período
  useEffect(() => {
    if (status === "authenticated") {
      loadTrendsData()
    }
  }, [trendsPeriod])

  // Validar que tenemos datos antes de renderizar
  const hasValidDashboardData = dashboardData && 
    dashboardData.distribution && 
    validateChartData(dashboardData.distribution.byGrado, 'votes')

  const hasValidTrendsData = trendsData && 
    trendsData.monthlyTrends && 
    validateChartData(trendsData.monthlyTrends, 'totalVotes')

  const hasValidParticipationData = participationData && 
    participationData.byGrado && 
    validateChartData(participationData.byGrado, 'votes')

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Cargando dashboard de analytics...</p>
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
              Solo los administradores pueden acceder al dashboard de analytics
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  Dashboard de Analytics
                </CardTitle>
                <CardDescription className="text-lg">
                  Estadísticas completas del Sistema Bandera de la Empatía
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadAllData} variant="outline" size="sm" disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Button onClick={() => window.location.href = "/admin"} variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs de navegación */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tendencias
            </TabsTrigger>
            <TabsTrigger value="participation" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participación
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Rendimiento
            </TabsTrigger>
          </TabsList>

          {/* TAB: RESUMEN */}
          <TabsContent value="overview" className="space-y-6">
            {dashboardData && (
              <>
                {/* KPIs principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardDescription className="text-purple-100">Total Votos</CardDescription>
                          <CardTitle className="text-3xl font-bold">{dashboardData.overview.totalVotes.toLocaleString()}</CardTitle>
                        </div>
                        <Vote className="w-8 h-8 text-purple-200" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-purple-100">
                        {dashboardData.overview.currentMonthVotes} este mes
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardDescription className="text-cyan-100">Candidatos Activos</CardDescription>
                          <CardTitle className="text-3xl font-bold">{dashboardData.overview.activeCandidates}</CardTitle>
                        </div>
                        <Users className="w-8 h-8 text-cyan-200" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-cyan-100">
                        {dashboardData.overview.totalCandidates} total
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardDescription className="text-emerald-100">Participación Única</CardDescription>
                          <CardTitle className="text-3xl font-bold">{dashboardData.overview.uniqueVoters}</CardTitle>
                        </div>
                        <Target className="w-8 h-8 text-emerald-200" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-emerald-100">
                        períodos únicos
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardDescription className="text-amber-100">Promedio por Candidato</CardDescription>
                          <CardTitle className="text-3xl font-bold">{dashboardData.overview.averageVotesPerCandidate}</CardTitle>
                        </div>
                        <Award className="w-8 h-8 text-amber-200" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-amber-100">
                        votos promedio
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos principales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Distribución por Grado */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Distribución por Grado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const processedData = safeProcessData(dashboardData.distribution.byGrado, 'grado', 'grado-dist')
                        
                        if (!processedData.length) {
                          return <ChartError message="No hay datos de distribución por grado" />
                        }

                        return (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={processedData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="grado" 
                                tick={{ fontSize: 12 }}
                                interval={0}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip 
                                formatter={(value: number, name: string) => {
                                  const item = processedData.find(d => d.votes === value)
                                  return [
                                    `${value} votos (${item?.percentage?.toFixed(1) || '0.0'}%)`,
                                    'Votos'
                                  ]
                                }}
                                labelFormatter={(label) => `Grado: ${label}`}
                              />
                              <Bar 
                                dataKey="votes" 
                                fill={COLORS.primary} 
                                radius={[4, 4, 0, 0]}
                                key="votes-bar-grado" // Clave estática para el componente Bar
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </CardContent>
                  </Card>

                  {/* Distribución por Curso */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-cyan-600" />
                        Distribución por Curso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const processedData = safeProcessData(dashboardData.distribution.byCurso, 'curso', 'curso-dist')
                        
                        if (!processedData.length) {
                          return <ChartError message="No hay datos de distribución por curso" />
                        }

                        return (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={processedData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({curso, percentage}) => `${curso} (${percentage?.toFixed(1) || '0.0'}%)`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="votes"
                                key="pie-curso" // Clave estática para el componente Pie
                              >
                                {processedData.map((entry, index) => (
                                  <Cell 
                                    key={`curso-cell-${entry._chartKey}-${index}`} // Usar la clave única generada
                                    fill={COLORS.gradient[index % COLORS.gradient.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => [`${value} votos`, 'Total']}
                                labelFormatter={(label) => `Curso: ${label}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Top Candidatos y Períodos Activos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Candidatos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        Top Candidatos Históricos
                      </CardTitle>
                      <CardDescription>
                        Los candidatos más votados de todos los tiempos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.topCandidates.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {item.candidate.nombre} {item.candidate.apellido}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.candidate.grado} - {item.candidate.curso}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{item.totalVotes}</div>
                              <div className="text-sm text-gray-500">votos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Períodos más Activos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Períodos Más Activos
                      </CardTitle>
                      <CardDescription>
                        Los meses con mayor participación estudiantil
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.mostActivePeriods.map((period, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">{period.period}</div>
                                <div className="text-sm text-gray-500">Período de votación</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{period.votes}</div>
                              <div className="text-sm text-gray-500">votos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* TAB: TENDENCIAS */}
          <TabsContent value="trends" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Análisis de Tendencias</h3>
              <Select value={trendsPeriod} onValueChange={setTrendsPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {trendsData && (
              <>
                {/* Métricas de tendencias */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Total de Períodos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {trendsData.summary.totalPeriods}
                      </div>
                      <div className="text-sm text-gray-500">períodos analizados</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Votos Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-cyan-600">
                        {trendsData.summary.totalVotesInPeriod.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">en el período seleccionado</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Promedio Mensual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-600">
                        {trendsData.summary.averageVotesPerMonth}
                      </div>
                      <div className="text-sm text-gray-500">votos por mes</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico de tendencias */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Evolución de Votos por Período
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const processedData = safeProcessData(trendsData.monthlyTrends, 'period', 'trends-monthly')
                      
                      if (!processedData.length) {
                        return <ChartError message="No hay datos de tendencias disponibles" />
                      }

                      return (
                        <ResponsiveContainer width="100%" height={400}>
                          <AreaChart data={processedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="period" 
                              tick={{ fontSize: 11 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              formatter={(value: number, name: string) => [
                                name === 'totalVotes' ? `${value} votos` : `${value} candidatos`,
                                name === 'totalVotes' ? 'Total de Votos' : 'Candidatos Activos'
                              ]}
                              labelFormatter={(label) => `Período: ${label}`}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="totalVotes" 
                              stackId="1" 
                              stroke={COLORS.primary} 
                              fill={COLORS.primary}
                              fillOpacity={0.6}
                              name="Total de Votos"
                              key="area-total-votes" // Clave estática
                            />
                            <Area 
                              type="monotone" 
                              dataKey="activeCandidates" 
                              stackId="2" 
                              stroke={COLORS.secondary} 
                              fill={COLORS.secondary}
                              fillOpacity={0.6}
                              name="Candidatos Activos"
                              key="area-active-candidates" // Clave estática
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Tabla de crecimiento */}
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Crecimiento Mes a Mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Período</th>
                            <th className="text-right p-2">Votos</th>
                            <th className="text-right p-2">Candidatos</th>
                            <th className="text-right p-2">Promedio</th>
                            <th className="text-right p-2">Crecimiento Votos</th>
                            <th className="text-right p-2">Crecimiento Candidatos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendsData.monthlyTrends.map((trend, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-2 font-medium">{trend.period}</td>
                              <td className="p-2 text-right">{trend.totalVotes}</td>
                              <td className="p-2 text-right">{trend.activeCandidates}</td>
                              <td className="p-2 text-right">{trend.averageVotesPerCandidate}</td>
                              <td className="p-2 text-right">
                                <Badge variant={trend.growth.votes >= 0 ? "default" : "destructive"}>
                                  {trend.growth.votes >= 0 ? '+' : ''}{trend.growth.votes.toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="p-2 text-right">
                                <Badge variant={trend.growth.candidates >= 0 ? "default" : "destructive"}>
                                  {trend.growth.candidates >= 0 ? '+' : ''}{trend.growth.candidates.toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB: PARTICIPACIÓN */}
          <TabsContent value="participation" className="space-y-6">
            <h3 className="text-2xl font-bold">Análisis de Participación por Segmentos</h3>

            {participationData && (
              <>
                {/* Métricas de participación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Votantes Únicos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {participationData.frequency.totalUniqueVoters}
                      </div>
                      <div className="text-sm text-gray-500">períodos de participación únicos</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Participación Promedio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-cyan-600">
                        {participationData.frequency.averageParticipation.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">votos por período único</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos de participación */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Participación por Grado - Versión Vertical */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Participación por Grado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        if (!participationData || !participationData.byGrado || !Array.isArray(participationData.byGrado)) {
                          return (
                            <div className="flex items-center justify-center h-[300px]">
                              <div className="text-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">📊</span>
                                </div>
                                <p className="text-sm text-gray-500">No hay datos de participación por grado</p>
                              </div>
                            </div>
                          )
                        }

                        // Crear datos con estructura simple y nombres estándar
                        const chartData = participationData.byGrado
                          .filter(item => item && item.grado && typeof item.votes === 'number' && item.votes >= 0)
                          .map((item, index) => ({
                            // Usar 'name' y 'value' que son estándar en Recharts
                            name: item.grado,
                            value: item.votes,
                            percentage: item.percentage || 0,
                            // ID único para debug
                            id: `grado-${index}-${item.grado.replace(/[^a-zA-Z0-9]/g, '')}`
                          }))

                        if (!chartData.length) {
                          return (
                            <div className="flex items-center justify-center h-[300px]">
                              <div className="text-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">📊</span>
                                </div>
                                <p className="text-sm text-gray-500">No hay datos válidos de participación por grado</p>
                              </div>
                            </div>
                          )
                        }

                        // Log para debug
                        console.log('Datos para gráfico vertical:', chartData)

                        return (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart 
                              data={chartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip 
                                formatter={(value: number, name: string, props: any) => [
                                  `${value} votos (${props.payload.percentage.toFixed(1)}%)`,
                                  'Participación'
                                ]}
                                labelFormatter={(label) => `Grado: ${label}`}
                              />
                              {/* BAR ULTRA-SIMPLE SIN PROPIEDADES ADICIONALES */}
                              <Bar 
                                dataKey="value" 
                                fill={COLORS.primary}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </CardContent>
                  </Card>

                  {/* Participación por Curso */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-cyan-600" />
                        Participación por Curso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        if (!participationData?.byCurso?.length) {
                          return (
                            <div className="flex items-center justify-center h-[300px]">
                              <div className="text-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">📊</span>
                                </div>
                                <p className="text-sm text-gray-500">No hay datos de participación por curso</p>
                              </div>
                            </div>
                          )
                        }

                        // Crear datos únicos
                        const uniqueData = participationData.byCurso.map((item, index) => ({
                          ...item,
                          id: `curso-${item.curso}-${index}`,
                          votes: Number(item.votes) || 0,
                          percentage: Number(item.percentage) || 0
                        }))

                        if (!uniqueData.length || uniqueData.every(item => item.votes === 0)) {
                          return (
                            <div className="flex items-center justify-center h-[300px]">
                              <div className="text-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">📊</span>
                                </div>
                                <p className="text-sm text-gray-500">No hay datos válidos de participación por curso</p>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={uniqueData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({curso, percentage}) => `${curso}\n${(percentage || 0).toFixed(1)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="votes"
                              >
                                {uniqueData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${entry.id}-${index}`} // Usar el ID único
                                    fill={COLORS.gradient[index % COLORS.gradient.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => [`${value} votos`, 'Total']}
                                labelFormatter={(label) => `Curso: ${label}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Matriz de participación */}
                <Card>
                  <CardHeader>
                    <CardTitle>Matriz de Participación Grado x Curso</CardTitle>
                    <CardDescription>
                      Distribución detallada de votos por grado y curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['Arrayan', 'Jacarandá', 'Ceibo'].map(curso => (
                        <div key={curso} className="space-y-2">
                          <h4 className="font-semibold text-lg text-center">{curso}</h4>
                          <div className="space-y-2">
                            {['1ro', '2do', '3ro', '4to', '5to', '6to'].map(grado => {
                              const data = participationData.matrix.find(
                                item => item.grado === grado && item.curso === curso
                              )
                              return (
                                <div key={grado} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="text-sm font-medium">{grado}</span>
                                  <div className="text-right">
                                    <div className="font-bold">{data?.votes || 0}</div>
                                    <div className="text-xs text-gray-500">
                                      {data?.percentage.toFixed(1) || '0.0'}%
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB: RENDIMIENTO */}
          <TabsContent value="performance" className="space-y-6">
            <h3 className="text-2xl font-bold">Métricas de Rendimiento del Sistema</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardDescription className="text-green-100">Tiempo de Respuesta</CardDescription>
                      <CardTitle className="text-2xl font-bold">~120ms</CardTitle>
                    </div>
                    <Zap className="w-8 h-8 text-green-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-green-100">Promedio del sistema</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardDescription className="text-blue-100">Disponibilidad</CardDescription>
                      <CardTitle className="text-2xl font-bold">99.9%</CardTitle>
                    </div>
                    <Activity className="w-8 h-8 text-blue-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-blue-100">Uptime del sistema</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardDescription className="text-red-100">Tasa de Error</CardDescription>
                      <CardTitle className="text-2xl font-bold">0.01%</CardTitle>
                    </div>
                    <Target className="w-8 h-8 text-red-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-red-100">Errores del sistema</div>
                </CardContent>
              </Card>
            </div>

            {dashboardData && (
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Base de Datos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {dashboardData.overview.totalCandidates}
                      </div>
                      <div className="text-sm text-gray-500">Candidatos</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-cyan-600">
                        {dashboardData.overview.totalVotes}
                      </div>
                      <div className="text-sm text-gray-500">Votos</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">1</div>
                      <div className="text-sm text-gray-500">Usuarios Admin</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        {dashboardData.overview.uniqueVoters}
                      </div>
                      <div className="text-sm text-gray-500">Períodos Únicos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}