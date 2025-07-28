// components/ui/lazy-loader.tsx - Sistema de Lazy Loading inteligente
"use client"

import { Suspense, lazy, ComponentType, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, BarChart3, Users, Calendar, Trophy, Settings, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

// Tipos para el sistema de lazy loading
interface LazyLoaderProps {
  children: ReactNode
  fallback?: ReactNode
  errorBoundary?: ComponentType<{ error: Error; retry: () => void }>
  className?: string
}

interface SmartFallbackProps {
  type?: 'dashboard' | 'results' | 'admin' | 'charts' | 'general'
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showProgress?: boolean
}

// Fallbacks inteligentes según el tipo de componente
const contextualFallbacks = {
  dashboard: {
    icon: BarChart3,
    message: "Cargando Dashboard Analytics...",
    description: "Procesando métricas y generando gráficos",
    color: "from-purple-500 to-blue-600"
  },
  results: {
    icon: Trophy,
    message: "Calculando Resultados...",
    description: "Procesando votos y estadísticas",
    color: "from-yellow-500 to-orange-600"
  },
  admin: {
    icon: Settings,
    message: "Cargando Panel Administrativo...",
    description: "Preparando herramientas de gestión",
    color: "from-green-500 to-emerald-600"
  },
  charts: {
    icon: Activity,
    message: "Generando Gráficos...",
    description: "Renderizando visualizaciones",
    color: "from-indigo-500 to-purple-600"
  },
  general: {
    icon: Loader2,
    message: "Cargando...",
    description: "Preparando contenido",
    color: "from-gray-500 to-gray-600"
  }
}

// Componente de fallback inteligente
export function SmartFallback({ 
  type = 'general', 
  message, 
  size = 'md',
  showProgress = false 
}: SmartFallbackProps) {
  const context = contextualFallbacks[type]
  const Icon = context.icon

  const sizeClasses = {
    sm: { container: "p-4", icon: "w-8 h-8", title: "text-lg", desc: "text-sm" },
    md: { container: "p-8", icon: "w-12 h-12", title: "text-xl", desc: "text-base" },
    lg: { container: "p-12", icon: "w-16 h-16", title: "text-2xl", desc: "text-lg" },
    xl: { container: "p-16", icon: "w-20 h-20", title: "text-3xl", desc: "text-xl" }
  }

  const classes = sizeClasses[size]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center animate-in fade-in duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardContent className={classes.container}>
          {/* Icono animado */}
          <div className="relative mx-auto mb-6">
            <div className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-20",
              `bg-gradient-to-r ${context.color}`
            )}></div>
            <div className={cn(
              "relative rounded-full flex items-center justify-center shadow-lg animate-pulse",
              `bg-gradient-to-r ${context.color}`,
              classes.icon
            )}>
              <Icon className={cn(
                "text-white",
                type === 'general' && "animate-spin",
                Icon === BarChart3 && "animate-pulse",
                Icon === Activity && "animate-bounce"
              )} />
            </div>
          </div>

          {/* Título y descripción */}
          <h2 className={cn(
            "font-bold text-gray-900 dark:text-white mb-2",
            classes.title
          )}>
            {message || context.message}
          </h2>
          <p className={cn(
            "text-gray-600 dark:text-gray-300",
            classes.desc
          )}>
            {context.description}
          </p>

          {/* Barra de progreso opcional */}
          {showProgress && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className={cn(
                  "h-2 rounded-full animate-pulse",
                  `bg-gradient-to-r ${context.color}`
                )} style={{ width: '60%', animation: 'pulse 2s ease-in-out infinite' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Inicializando componentes...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Wrapper principal de lazy loading
export function LazyLoader({ 
  children, 
  fallback, 
  errorBoundary: ErrorBoundary,
  className 
}: LazyLoaderProps) {
  const defaultFallback = fallback || <SmartFallback />

  if (ErrorBoundary) {
    return (
      <ErrorBoundary error={new Error('Loading error')} retry={() => window.location.reload()}>
        <Suspense fallback={defaultFallback}>
          <div className={className}>
            {children}
          </div>
        </Suspense>
      </ErrorBoundary>
    )
  }

  return (
    <Suspense fallback={defaultFallback}>
      <div className={className}>
        {children}
      </div>
    </Suspense>
  )
}

// HOC para lazy loading automático
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallbackType: SmartFallbackProps['type'] = 'general',
  options: {
    errorBoundary?: boolean
    preload?: boolean
    fallbackSize?: SmartFallbackProps['size']
  } = {}
) {
  const LazyComponent = lazy(() => 
    Promise.resolve({ default: Component })
  )

  const WrappedComponent = (props: T) => {
    const fallback = (
      <SmartFallback 
        type={fallbackType} 
        size={options.fallbackSize || 'md'}
        showProgress={true}
      />
    )

    return (
      <LazyLoader 
        fallback={fallback}
        errorBoundary={options.errorBoundary ? DefaultErrorBoundary : undefined}
      >
        <LazyComponent {...props} />
      </LazyLoader>
    )
  }

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`
  
  // Preload opcional
  if (options.preload && typeof window !== 'undefined') {
    // Precargar en idle time
    requestIdleCallback(() => {
      import(/* webpackMode: "weak" */ 'react').then(() => {
        // Componente precargado
      })
    })
  }

  return WrappedComponent
}

// Error Boundary por defecto
class DefaultErrorBoundary extends Error {
  constructor(public error: Error, public retry: () => void) {
    super(error.message)
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy loading error:', error, errorInfo)
  }

  render() {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Error al cargar componente
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Hubo un problema al cargar esta sección
            </p>
            <button 
              onClick={this.retry}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }
}

// Utilidades adicionales para lazy loading
export const preloadComponent = (componentImport: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    requestIdleCallback(() => {
      componentImport().then(() => {
        console.log('Component preloaded')
      }).catch(console.error)
    })
  }
}

// Hook para lazy loading condicional
export function useLazyLoad(condition: boolean, componentImport: () => Promise<any>) {
  const [Component, setComponent] = useState<ComponentType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (condition && !Component && !loading) {
      setLoading(true)
      setError(null)
      
      componentImport()
        .then(module => {
          setComponent(() => module.default || module)
        })
        .catch(setError)
        .finally(() => setLoading(false))
    }
  }, [condition, Component, loading, componentImport])

  return { Component, loading, error }
}