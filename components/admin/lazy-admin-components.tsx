// components/admin/lazy-admin-components.tsx - Componentes administrativos con lazy loading
"use client"

import { lazy } from 'react'
import { LazyLoader, SmartFallback } from '@/components/ui/lazy-loader'

// Lazy loading de páginas administrativas
export const LazyAdminDashboard = lazy(() => 
  import('@/app/admin/dashboard/page').then(module => ({ 
    default: module.default 
  }))
)

export const LazyAdminPeriods = lazy(() => 
  import('@/app/admin/periods/page').then(module => ({ 
    default: module.default 
  }))
)

export const LazyResultsPage = lazy(() => 
  import('@/app/results/page').then(module => ({ 
    default: module.default 
  }))
)

// Wrappers con fallbacks específicos
export function AdminDashboardLazy(props: any) {
  return (
    <LazyLoader 
      fallback={
        <SmartFallback 
          type="dashboard" 
          size="lg" 
          showProgress={true}
          message="Inicializando Dashboard Analytics..."
        />
      }
    >
      <LazyAdminDashboard {...props} />
    </LazyLoader>
  )
}

export function AdminPeriodsLazy(props: any) {
  return (
    <LazyLoader 
      fallback={
        <SmartFallback 
          type="admin" 
          size="lg"
          showProgress={true}
          message="Cargando Gestión de Períodos..."
        />
      }
    >
      <LazyAdminPeriods {...props} />
    </LazyLoader>
  )
}

export function ResultsPageLazy(props: any) {
  return (
    <LazyLoader 
      fallback={
        <SmartFallback 
          type="results" 
          size="lg"
          showProgress={true}
          message="Calculando Resultados de Votación..."
        />
      }
    >
      <LazyResultsPage {...props} />
    </LazyLoader>
  )
}

// Hook para navegación lazy
export function useLazyNavigation() {
  const navigateToAdmin = () => {
    // Precargar antes de navegar
    import('@/app/admin/page').then(() => {
      window.location.href = '/admin'
    })
  }

  const navigateToDashboard = () => {
    import('@/app/admin/dashboard/page').then(() => {
      window.location.href = '/admin/dashboard'
    })
  }

  const navigateToPeriods = () => {
    import('@/app/admin/periods/page').then(() => {
      window.location.href = '/admin/periods'
    })
  }

  const navigateToResults = (params?: string) => {
    import('@/app/results/page').then(() => {
      window.location.href = `/results${params ? `?${params}` : ''}`
    })
  }

  return {
    navigateToAdmin,
    navigateToDashboard,
    navigateToPeriods,
    navigateToResults
  }
}