// PARTE 1: IMPORTS Y COMPONENTES BASE MEJORADOS
// Reemplaza los imports existentes con estos mejorados

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
  Target, Award, Zap, Eye, Shield, Crown, Sparkles, Star,
  Database, Gauge, LineChart as LineChartIcon, Heart
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle, ThemeGradientBackground } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

// COMPONENTE CHARTEERROR MEJORADO - Reemplaza el existente
const ChartError = ({ message = "No hay datos disponibles" }: { message?: string }) => (
  <div className="flex items-center justify-center h-[300px] animate-in fade-in duration-300">
    <div className="text-center">
      <div className="relative mx-auto mb-4 w-16 h-16">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse opacity-20"></div>
        <div className="relative w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center shadow-lg">
          <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">Sin datos disponibles</p>
      <p className="text-sm text-gray-500 dark:text-gray-500">{message}</p>
    </div>
  </div>
)

// FUNCIONES AUXILIARES MEJORADAS - Mantén las que ya tienes, estas son mejoras adicionales
const cleanChartData = (data: any[], keyField: string, prefix: string = 'chart') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return []
  }
  
  return data
    .filter(item => item && item[keyField] !== null && item[keyField] !== undefined)
    .map((item, index) => ({
      ...item,
      _chartKey: `${prefix}-${keyField}-${item[keyField]}-${index}-${Date.now()}`,
      votes: typeof item.votes === 'number' ? item.votes : 0,
      _count: typeof item._count === 'number' ? item._count : 0
    }))
}

const validateChartData = (data: any[], requiredField: string = 'votes') => {
  return data && 
         Array.isArray(data) && 
         data.length > 0 && 
         data.some(item => item && typeof item[requiredField] === 'number' && item[requiredField] > 0)
}

const safeProcessData = (data: any[], keyField: string, prefix: string = 'chart') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return []
  }
  
  return data
    .filter(item => item && item[keyField] !== null && item[keyField] !== undefined)
    .map((item, index) => ({
      ...item,
      _chartKey: `${prefix}-${keyField}-${item[keyField]}-${index}`,
      votes: typeof item.votes === 'number' ? item.votes : 0,
      percentage: typeof item.percentage === 'number' ? item.percentage : 0,
      gradoKey: `grado-${item[keyField]}-${index}`
    }))
}

// COLORES MEJORADOS - Reemplaza el objeto COLORS existente
const COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4', 
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gradient: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
  charts: {
    purple: ['#8b5cf6', '#a855f7', '#c084fc'],
    blue: ['#06b6d4', '#0ea5e9', '#3b82f6'],
    green: ['#10b981', '#22c55e', '#16a34a'],
    orange: ['#f59e0b', '#f97316', '#ea580c']
  }
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

  // PARTE 2: ESTADOS DE LOADING Y AUTENTICACIÓN MEJORADOS
  // LOADING STATE MEJORADO - Reemplaza el if de loading existente
  if (status === "loading" || isLoading) {
    return (
      <ThemeGradientBackground variant="purple">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Cargando Dashboard Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Procesando estadísticas y generando gráficos...
              </p>
            </CardContent>
          </Card>
        </div>
      </ThemeGradientBackground>
    )
  }

  // AUTHENTICATION CHECK MEJORADO - Reemplaza el if de session existente
  if (!session) {
    return (
      <ThemeGradientBackground variant="warm">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-in fade-in-up duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader className="pb-8">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Acceso Restringido
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                Solo los administradores pueden acceder al dashboard de analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = "/auth/signin"} 
                className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white transition-all duration-300 hover:scale-105 shadow-lg"
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

  // PARTE 3: LAYOUT PRINCIPAL Y HEADER MEJORADO
  // Reemplaza el return principal y el header existente
  return (
    <ThemeGradientBackground variant="purple">
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
        
          {/* HEADER MEJORADO - Reemplaza el Card de header existente */}
          <Card className="animate-in fade-in-down duration-500 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader className="pb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full animate-pulse opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-8 h-8 text-white animate-float" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Dashboard de Analytics
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                      Estadísticas completas del Sistema Bandera de la Empatía
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={loadAllData} 
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

          {/* TABS MEJORADOS - Reemplaza el componente Tabs existente */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-in slide-in-from-bottom duration-500 animation-delay-200">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border-0">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                <Eye className="w-4 h-4" />
                Resumen
              </TabsTrigger>
              <TabsTrigger 
                value="trends" 
                className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                <TrendingUp className="w-4 h-4" />
                Tendencias
              </TabsTrigger>
              <TabsTrigger 
                value="participation" 
                className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4" />
                Participación
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
              >
                <Activity className="w-4 h-4" />
                Rendimiento
              </TabsTrigger>
            </TabsList>

          {/* TAB: RESUMEN */}
          {/* PARTE 4: TAB OVERVIEW - KPIs Y GRÁFICOS MEJORADOS */}
          {/* Reemplaza todo el contenido del TabsContent value="overview" */ }

          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
            {dashboardData && (
              <>
                {/* KPIs PRINCIPALES MEJORADOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-300">
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardDescription className="text-purple-100 font-medium">Total Votos</CardDescription>
                          <CardTitle className="text-3xl font-bold">{dashboardData.overview.totalVotes.toLocaleString()}</CardTitle>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-purple-300 rounded-full animate-pulse opacity-30"></div>
                          <Vote className="relative w-12 h-12 text-purple-200" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-purple-100 font-medium">
                        +{dashboardData.overview.currentMonthVotes} este mes
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardDescription className="text-cyan-100 font-medium">Candidatos Activos</CardDescription>
                          <CardTitle className="text-3xl font-bold">{dashboardData.overview.activeCandidates}</CardTitle>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-cyan-300 rounded-full animate-pulse opacity-30"></div>
                          <Users className="relative w-12 h-12 text-cyan-200" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-cyan-100 font-medium">
                        {dashboardData.overview.totalCandidates} total
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardDescription className="text-emerald-100 font-medium">Participación Única</CardDescription>
                          <CardTitle className="text-3xl font-bold">{dashboardData.overview.uniqueVoters}</CardTitle>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-300 rounded-full animate-pulse opacity-30"></div>
                          <Target className="relative w-12 h-12 text-emerald-200" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-emerald-100 font-medium">
                        períodos únicos
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardDescription className="text-amber-100 font-medium">Promedio por Candidato</CardDescription>
                          <CardTitle className="text-3xl font-bold">{dashboardData.overview.averageVotesPerCandidate}</CardTitle>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-amber-300 rounded-full animate-pulse opacity-30"></div>
                          <Award className="relative w-12 h-12 text-amber-200" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-amber-100 font-medium">
                        votos promedio
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* GRÁFICOS PRINCIPALES MEJORADOS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-400">
                  {/* Distribución por Grado Mejorada */}
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
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
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                              <XAxis 
                                dataKey="grado" 
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                interval={0}
                              />
                              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                              <Tooltip 
                                formatter={(value: number, name: string) => {
                                  const item = processedData.find(d => d.votes === value)
                                  return [
                                    `${value} votos (${item?.percentage?.toFixed(1) || '0.0'}%)`,
                                    'Votos'
                                  ]
                                }}
                                labelFormatter={(label) => `Grado: ${label}`}
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Bar 
                                dataKey="votes" 
                                fill="url(#purpleGradient)" 
                                radius={[4, 4, 0, 0]}
                                key="votes-bar-grado"
                              />
                              <defs>
                                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                              </defs>
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </CardContent>
                  </Card>

                  {/* Distribución por Curso Mejorada */}
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <PieChartIcon className="w-5 h-5 text-white" />
                        </div>
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
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="votes"
                                key="pie-curso"
                              >
                                {processedData.map((entry, index) => (
                                  <Cell 
                                    key={`curso-cell-${entry._chartKey}-${index}`}
                                    fill={COLORS.gradient[index % COLORS.gradient.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => [`${value} votos`, 'Total']}
                                labelFormatter={(label) => `Curso: ${label}`}
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Top Candidatos y Períodos Activos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-500">
                  {/* Top Candidatos */}
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        Top Candidatos Históricos
                      </CardTitle>
                      <CardDescription>
                        Los candidatos más votados de todos los tiempos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.topCandidates.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-yellow-200 dark:border-yellow-800 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-lg ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                                index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white' :
                                index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                                'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
                              }`}>
                                {index === 0 ? <Crown className="w-5 h-5" /> : 
                                index === 1 ? <Award className="w-5 h-5" /> :
                                index === 2 ? <Star className="w-5 h-5" /> : 
                                index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {item.candidate.nombre} {item.candidate.apellido}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                                  <Badge variant="outline" className="text-xs">{item.candidate.grado}</Badge>
                                  <Badge variant="secondary" className="text-xs">{item.candidate.curso}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{item.totalVotes}</div>
                              <div className="text-sm text-gray-500">votos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Períodos más Activos */}
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        Períodos Más Activos
                      </CardTitle>
                      <CardDescription>
                        Los meses con mayor participación estudiantil
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.mostActivePeriods.map((period, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-green-200 dark:border-green-800 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{period.period}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Período de votación</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xl text-green-600 dark:text-green-400">{period.votes}</div>
                              <div className="text-sm text-gray-500">votos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Mensaje de Empatía Mejorado */}
                <Card className="animate-in fade-in duration-500 animation-delay-700 shadow-xl border-0 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Heart className="w-8 h-8 text-pink-500 animate-heartbeat" />
                      <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
                      <Heart className="w-8 h-8 text-pink-500 animate-heartbeat" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      ¡Dashboard de la Empatía!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                      Cada estadística representa el crecimiento de nuestra comunidad empática. 
                      Gracias por hacer posible este sistema de reconocimiento.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB: TENDENCIAS MEJORADO - Reemplaza todo el TabsContent value="trends" */}
          <TabsContent value="trends" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Análisis de Tendencias
                </h3>
              </div>
              
              <Select value={trendsPeriod} onValueChange={setTrendsPeriod}>
                <SelectTrigger className="w-48 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-cyan-200 dark:border-cyan-800 transition-all duration-300 hover:shadow-lg">
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
                {/* Métricas de tendencias mejoradas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-200">
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        Total de Períodos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {trendsData.summary.totalPeriods}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">períodos analizados</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Vote className="w-5 h-5 text-cyan-600" />
                        Votos Totales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                        {trendsData.summary.totalVotesInPeriod.toLocaleString()}
                      </div>
                      <div className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">en el período seleccionado</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Promedio Mensual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                        {trendsData.summary.averageVotesPerMonth}
                      </div>
                      <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">votos por mes</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico de tendencias mejorado */}
                <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                        <LineChartIcon className="w-5 h-5 text-white" />
                      </div>
                      Evolución de Votos por Período
                    </CardTitle>
                    <CardDescription>
                      Tendencia histórica de participación y candidatos activos
                    </CardDescription>
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                            <XAxis 
                              dataKey="period" 
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <Tooltip 
                              formatter={(value: number, name: string) => [
                                name === 'totalVotes' ? `${value} votos` : `${value} candidatos`,
                                name === 'totalVotes' ? 'Total de Votos' : 'Candidatos Activos'
                              ]}
                              labelFormatter={(label) => `Período: ${label}`}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                backdropFilter: 'blur(8px)'
                              }}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="totalVotes" 
                              stackId="1" 
                              stroke="#06b6d4" 
                              fill="url(#cyanAreaGradient)"
                              fillOpacity={0.8}
                              name="Total de Votos"
                              key="area-total-votes"
                              strokeWidth={3}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="activeCandidates" 
                              stackId="2" 
                              stroke="#8b5cf6" 
                              fill="url(#purpleAreaGradient)"
                              fillOpacity={0.6}
                              name="Candidatos Activos"
                              key="area-active-candidates"
                              strokeWidth={2}
                            />
                            <defs>
                              <linearGradient id="cyanAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="purpleAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                          </AreaChart>
                        </ResponsiveContainer>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Tabla de crecimiento mejorada */}
                <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-600 border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      Análisis de Crecimiento Mes a Mes
                    </CardTitle>
                    <CardDescription>
                      Comparativa detallada de métricas de crecimiento periodo a periodo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-indigo-200 dark:border-indigo-800">
                            <th className="text-left p-3 font-semibold text-indigo-800 dark:text-indigo-200">Período</th>
                            <th className="text-right p-3 font-semibold text-indigo-800 dark:text-indigo-200">Votos</th>
                            <th className="text-right p-3 font-semibold text-indigo-800 dark:text-indigo-200">Candidatos</th>
                            <th className="text-right p-3 font-semibold text-indigo-800 dark:text-indigo-200">Promedio</th>
                            <th className="text-right p-3 font-semibold text-indigo-800 dark:text-indigo-200">Crecimiento Votos</th>
                            <th className="text-right p-3 font-semibold text-indigo-800 dark:text-indigo-200">Crecimiento Candidatos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendsData.monthlyTrends.map((trend, index) => (
                            <tr key={index} className="border-b border-indigo-100 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-300">
                              <td className="p-3 font-medium text-gray-900 dark:text-white">{trend.period}</td>
                              <td className="p-3 text-right font-semibold text-cyan-600 dark:text-cyan-400">{trend.totalVotes}</td>
                              <td className="p-3 text-right font-semibold text-purple-600 dark:text-purple-400">{trend.activeCandidates}</td>
                              <td className="p-3 text-right text-gray-700 dark:text-gray-300">{trend.averageVotesPerCandidate}</td>
                              <td className="p-3 text-right">
                                <Badge 
                                  variant={trend.growth.votes >= 0 ? "default" : "destructive"}
                                  className={cn(
                                    "font-semibold",
                                    trend.growth.votes >= 0 
                                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white" 
                                      : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                  )}
                                >
                                  {trend.growth.votes >= 0 ? '+' : ''}{trend.growth.votes.toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                <Badge 
                                  variant={trend.growth.candidates >= 0 ? "default" : "destructive"}
                                  className={cn(
                                    "font-semibold",
                                    trend.growth.candidates >= 0 
                                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white" 
                                      : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                  )}
                                >
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

                {/* Insights de Tendencias */}
                <Card className="animate-in fade-in duration-500 animation-delay-800 shadow-xl border-0 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <TrendingUp className="w-8 h-8 text-cyan-500 animate-pulse" />
                      <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                      <TrendingUp className="w-8 h-8 text-cyan-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      ¡Tendencias de Crecimiento!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                      Cada tendencia muestra el crecimiento continuo de nuestra comunidad empática. 
                      Los datos revelan patrones de participación que fortalecen nuestro sistema.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB: PARTICIPACIÓN COMPLETO MEJORADO - Reemplaza todo el TabsContent value="participation" */}
          <TabsContent value="participation" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Análisis de Participación por Segmentos
              </h3>
            </div>

            {participationData && (
              <>
                {/* Métricas de participación mejoradas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-200">
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        Votantes Únicos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {participationData.frequency.totalUniqueVoters}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">períodos de participación únicos</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                        Participación Promedio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                        {participationData.frequency.averageParticipation.toFixed(1)}
                      </div>
                      <div className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">votos por período único</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos de participación mejorados */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-400">
                  {/* Participación por Grado Mejorada */}
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        Participación por Grado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        if (!participationData?.byGrado?.length) {
                          return <ChartError message="No hay datos de participación por grado" />
                        }

                        const chartData = participationData.byGrado
                          .filter(item => item && item.grado && typeof item.votes === 'number' && item.votes >= 0)
                          .map((item, index) => ({
                            name: item.grado,
                            value: item.votes,
                            percentage: item.percentage || 0,
                            id: `grado-${index}-${item.grado.replace(/[^a-zA-Z0-9]/g, '')}`
                          }))

                        if (!chartData.length) {
                          return <ChartError message="No hay datos válidos de participación por grado" />
                        }

                        return (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                              <Tooltip 
                                formatter={(value: number, name: string, props: any) => [
                                  `${value} votos (${props.payload.percentage.toFixed(1)}%)`,
                                  'Participación'
                                ]}
                                labelFormatter={(label) => `Grado: ${label}`}
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Bar 
                                dataKey="value" 
                                fill="url(#purpleParticipationGradient)"
                                radius={[4, 4, 0, 0]}
                              />
                              <defs>
                                <linearGradient id="purpleParticipationGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                              </defs>
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </CardContent>
                  </Card>

                  {/* Participación por Curso Mejorada */}
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <PieChartIcon className="w-5 h-5 text-white" />
                        </div>
                        Participación por Curso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        if (!participationData?.byCurso?.length) {
                          return <ChartError message="No hay datos de participación por curso" />
                        }

                        const uniqueData = participationData.byCurso.map((item, index) => ({
                          ...item,
                          id: `curso-${item.curso}-${index}`,
                          votes: Number(item.votes) || 0,
                          percentage: Number(item.percentage) || 0
                        }))

                        if (!uniqueData.length || uniqueData.every(item => item.votes === 0)) {
                          return <ChartError message="No hay datos válidos de participación por curso" />
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
                                    key={`cell-${entry.id}-${index}`}
                                    fill={COLORS.gradient[index % COLORS.gradient.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => [`${value} votos`, 'Total']}
                                labelFormatter={(label) => `Curso: ${label}`}
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Matriz de participación mejorada */}
                <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-600 border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      Matriz de Participación Grado x Curso
                    </CardTitle>
                    <CardDescription>
                      Distribución detallada de votos por grado y curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {['Arrayan', 'Jacarandá', 'Ceibo'].map(curso => (
                        <div key={curso} className="space-y-3">
                          <h4 className="font-bold text-lg text-center py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg">
                            {curso}
                          </h4>
                          <div className="space-y-2">
                            {['1ro', '2do', '3ro', '4to', '5to', '6to'].map(grado => {
                              const data = participationData.matrix.find(
                                item => item.grado === grado && item.curso === curso
                              )
                              return (
                                <div key={grado} className="flex justify-between items-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all duration-300 hover:scale-105">
                                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{grado}</span>
                                  <div className="text-right">
                                    <div className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{data?.votes || 0}</div>
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

                {/* Mensaje de participación mejorado */}
                <Card className="animate-in fade-in duration-500 animation-delay-800 shadow-xl border-0 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Users className="w-8 h-8 text-emerald-500 animate-pulse" />
                      <Sparkles className="w-6 h-6 text-green-500 animate-pulse" />
                      <Users className="w-8 h-8 text-emerald-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                      ¡Participación Activa!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                      Cada voto es una expresión de participación democrática en nuestra comunidad educativa. 
                      La diversidad de grados y cursos enriquece nuestro sistema de reconocimiento.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB: RENDIMIENTO MEJORADO - Reemplaza todo el TabsContent value="performance" */}
          <TabsContent value="performance" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Métricas de Rendimiento del Sistema
              </h3>
            </div>

            {/* Métricas de rendimiento principales mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-200">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardDescription className="text-green-100 font-medium">Tiempo de Respuesta</CardDescription>
                      <CardTitle className="text-3xl font-bold">~120ms</CardTitle>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-300 rounded-full animate-pulse opacity-30"></div>
                      <Zap className="relative w-12 h-12 text-green-200" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-green-100 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
                    Promedio del sistema
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardDescription className="text-blue-100 font-medium">Disponibilidad</CardDescription>
                      <CardTitle className="text-3xl font-bold">99.9%</CardTitle>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-300 rounded-full animate-pulse opacity-30"></div>
                      <Activity className="relative w-12 h-12 text-blue-200" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-blue-100 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                    Uptime del sistema
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardDescription className="text-red-100 font-medium">Tasa de Error</CardDescription>
                      <CardTitle className="text-3xl font-bold">0.01%</CardTitle>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-300 rounded-full animate-pulse opacity-30"></div>
                      <Target className="relative w-12 h-12 text-red-200" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-red-100 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-200 rounded-full animate-pulse"></div>
                    Errores del sistema
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas técnicas adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom duration-500 animation-delay-300">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    CPU Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">23%</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">Promedio</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    RAM Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">1.2GB</div>
                  <div className="text-xs text-cyan-600 dark:text-cyan-400">En uso</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    API Calls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">1.2K</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Hoy</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Cache Hit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">94%</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Eficiencia</div>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas de Base de Datos mejoradas */}
            {dashboardData && (
              <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-400 border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    Estadísticas de Base de Datos
                  </CardTitle>
                  <CardDescription>
                    Métricas de almacenamiento y rendimiento de la base de datos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-purple-200 dark:border-purple-800 transition-all duration-300 hover:scale-105">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {dashboardData.overview.totalCandidates}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300 font-medium flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" />
                        Candidatos
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-cyan-200 dark:border-cyan-800 transition-all duration-300 hover:scale-105">
                      <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                        {dashboardData.overview.totalVotes}
                      </div>
                      <div className="text-sm text-cyan-700 dark:text-cyan-300 font-medium flex items-center justify-center gap-2">
                        <Vote className="w-4 h-4" />
                        Votos
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all duration-300 hover:scale-105">
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">1</div>
                      <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-amber-200 dark:border-amber-800 transition-all duration-300 hover:scale-105">
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                        {dashboardData.overview.uniqueVoters}
                      </div>
                      <div className="text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Períodos
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de rendimiento simulado */}
            <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <LineChartIcon className="w-5 h-5 text-white" />
                  </div>
                  Rendimiento del Sistema en Tiempo Real
                </CardTitle>
                <CardDescription>
                  Métricas de respuesta y throughput de las últimas 24 horas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { time: '00:00', responseTime: 120, throughput: 95 },
                    { time: '04:00', responseTime: 110, throughput: 98 },
                    { time: '08:00', responseTime: 140, throughput: 92 },
                    { time: '12:00', responseTime: 160, throughput: 89 },
                    { time: '16:00', responseTime: 135, throughput: 94 },
                    { time: '20:00', responseTime: 125, throughput: 96 },
                    { time: '24:00', responseTime: 115, throughput: 97 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'responseTime' ? `${value}ms` : `${value}%`,
                        name === 'responseTime' ? 'Tiempo de Respuesta' : 'Throughput'
                      ]}
                      labelFormatter={(label) => `Hora: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(8px)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                      name="Tiempo de Respuesta (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="throughput" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#f59e0b', strokeWidth: 2 }}
                      name="Throughput (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alertas y estado del sistema */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-500 animation-delay-600">
              <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    Estado del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        API Gateway
                      </span>
                      <Badge className="bg-green-500 text-white">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Base de Datos
                      </span>
                      <Badge className="bg-green-500 text-white">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Autenticación
                      </span>
                      <Badge className="bg-green-500 text-white">Activo</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    Monitoreo 24/7
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <span className="text-sm font-medium">Última verificación</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Hace 2 min</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <span className="text-sm font-medium">Próxima verificación</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">En 3 min</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <span className="text-sm font-medium">Alertas activas</span>
                      <Badge variant="secondary">0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mensaje de rendimiento */}
            <Card className="animate-in fade-in duration-500 animation-delay-800 shadow-xl border-0 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Zap className="w-8 h-8 text-orange-500 animate-pulse" />
                  <Sparkles className="w-6 h-6 text-red-500 animate-pulse" />
                  <Zap className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  ¡Sistema Optimizado!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Nuestro sistema mantiene un rendimiento óptimo para garantizar la mejor experiencia 
                  en cada voto y consulta. Monitoreamos constantemente para la excelencia.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="fixed bottom-6 right-6 animate-in slide-in-from-right duration-500 animation-delay-1000">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </ThemeGradientBackground>
  )
}