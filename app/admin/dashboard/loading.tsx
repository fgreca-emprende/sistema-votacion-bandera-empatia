// app/admin/dashboard/loading.tsx - Loading específico para dashboard
import { SmartFallback } from '@/components/ui/lazy-loader'

export default function DashboardLoading() {
  return (
    <SmartFallback 
      type="dashboard" 
      size="lg"
      showProgress={true}
      message="Cargando Analytics Avanzados..."
    />
  )
}