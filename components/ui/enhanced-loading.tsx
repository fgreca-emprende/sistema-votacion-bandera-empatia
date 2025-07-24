// components/ui/enhanced-loading.tsx
"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Loader2, Heart, Vote, Users, BarChart3 } from "lucide-react"

// Loading Skeleton mejorado con animaciones
export const LoadingSkeleton = ({ 
  className, 
  variant = "default",
  lines = 3,
  ...props 
}: {
  className?: string
  variant?: "default" | "card" | "text" | "button" | "chart"
  lines?: number
  [key: string]: any
}) => {
  const skeletonLines = Array.from({ length: lines }, (_, i) => i)

  if (variant === "card") {
    return (
      <div className={cn("animate-pulse space-y-4 p-6 bg-white rounded-lg border", className)} {...props}>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%] w-3/4"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%] w-1/2"></div>
        </div>
      </div>
    )
  }

  if (variant === "button") {
    return (
      <div className={cn("h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md animate-shimmer bg-[length:200%_100%]", className)} {...props}></div>
    )
  }

  if (variant === "chart") {
    return (
      <div className={cn("animate-pulse space-y-4 p-6", className)} {...props}>
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%] w-1/3"></div>
        <div className="flex space-x-2 h-32">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i}
              className="bg-gradient-to-t from-gray-200 via-gray-300 to-gray-200 rounded-t animate-shimmer bg-[length:100%_200%] flex-1"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            ></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("animate-pulse space-y-2", className)} {...props}>
      {skeletonLines.map((line) => (
        <div 
          key={line}
          className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        ></div>
      ))}
    </div>
  )
}

// Loading Spinner mejorado con contexto
export const SmartLoader = ({ 
  size = "default",
  context = "general",
  message,
  className 
}: {
  size?: "sm" | "default" | "lg"
  context?: "general" | "voting" | "results" | "candidates" | "dashboard"
  message?: string
  className?: string
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  const contextIcons = {
    general: Loader2,
    voting: Vote,
    results: BarChart3,
    candidates: Users,
    dashboard: BarChart3
  }

  const contextMessages = {
    general: "Cargando...",
    voting: "Preparando votación...",
    results: "Calculando resultados...",
    candidates: "Cargando candidatos...",
    dashboard: "Analizando datos..."
  }

  const Icon = contextIcons[context]
  const defaultMessage = contextMessages[context]

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <Icon className={cn("animate-spin text-purple-600", sizeClasses[size])} />
        {context === "voting" && (
          <Heart className="absolute -top-1 -right-1 h-3 w-3 text-red-500 animate-pulse" />
        )}
      </div>
      {(message || defaultMessage) && (
        <p className="text-sm text-gray-600 animate-pulse font-medium">
          {message || defaultMessage}
        </p>
      )}
    </div>
  )
}

// Loading Overlay para operaciones críticas
export const LoadingOverlay = ({ 
  isVisible, 
  message = "Procesando...",
  variant = "default" 
}: {
  isVisible: boolean
  message?: string
  variant?: "default" | "success" | "error"
}) => {
  if (!isVisible) return null

  const variants = {
    default: "bg-white/90 backdrop-blur-sm",
    success: "bg-green-50/90 backdrop-blur-sm",
    error: "bg-red-50/90 backdrop-blur-sm"
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300",
      variants[variant]
    )}>
      <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-300">
        <SmartLoader size="lg" message={message} />
      </div>
    </div>
  )
}

// Progressive Loading para listas
export const ProgressiveLoader = ({ 
  items,
  renderItem,
  isLoading,
  loadingCount = 3,
  className 
}: {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  isLoading: boolean
  loadingCount?: number
  className?: string
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div 
          key={item.id || index}
          className="animate-in slide-in-from-bottom duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {renderItem(item, index)}
        </div>
      ))}
      
      {isLoading && Array.from({ length: loadingCount }).map((_, index) => (
        <LoadingSkeleton 
          key={`loading-${index}`}
          variant="card"
          className="animate-in slide-in-from-bottom duration-300"
          style={{ animationDelay: `${(items.length + index) * 100}ms` }}
        />
      ))}
    </div>
  )
}