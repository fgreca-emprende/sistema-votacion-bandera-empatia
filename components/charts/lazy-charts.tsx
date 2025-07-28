// components/charts/lazy-charts.tsx - Charts optimizados con lazy loading
"use client"

import { lazy, Suspense } from 'react'
import { SmartFallback } from '@/components/ui/lazy-loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Lazy loading de componentes de Recharts
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })))
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })))
const Legend = lazy(() => import('recharts').then(module => ({ default: module.Legend })))
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })))
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })))
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })))
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })))
const Line = lazy(() => import('recharts').then(module => ({ default: module.Line })))

// Fallback específico para charts
const ChartFallback = ({ title }: { title?: string }) => (
  <Card className="h-[400px]">
    <CardHeader>
      <CardTitle>{title || "Gráfico"}</CardTitle>
    </CardHeader>
    <CardContent className="h-[300px] flex items-center justify-center">
      <SmartFallback 
        type="charts" 
        size="sm"
        message="Generando gráfico..."
      />
    </CardContent>
  </Card>
)

// Componentes de charts optimizados
export function LazyBarChart({ 
  data, 
  title, 
  xKey, 
  yKey, 
  color = "#8b5cf6",
  className 
}: {
  data: any[]
  title?: string
  xKey: string
  yKey: string
  color?: string
  className?: string
}) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <Suspense fallback={<ChartFallback title={title} />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Suspense>
      </CardContent>
    </Card>
  )
}

export function LazyPieChart({ 
  data, 
  title, 
  nameKey, 
  valueKey, 
  colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"],
  className 
}: {
  data: any[]
  title?: string
  nameKey: string
  valueKey: string
  colors?: string[]
  className?: string
}) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <Suspense fallback={<ChartFallback title={title} />}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Suspense>
      </CardContent>
    </Card>
  )
}

export function LazyLineChart({ 
  data, 
  title, 
  xKey, 
  yKey, 
  color = "#8b5cf6",
  className 
}: {
  data: any[]
  title?: string
  xKey: string
  yKey: string
  color?: string
  className?: string
}) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <Suspense fallback={<ChartFallback title={title} />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Suspense>
      </CardContent>
    </Card>
  )
}

// Hook para precargar charts cuando sea necesario
export function usePreloadCharts() {
  const preloadCharts = () => {
    if (typeof window !== 'undefined') {
      requestIdleCallback(() => {
        import('recharts').then(() => {
          console.log('Recharts preloaded successfully')
        }).catch(console.error)
      })
    }
  }

  return { preloadCharts }
}