// components/ui/enhanced-card.tsx
"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Star, TrendingUp, Award, Zap } from "lucide-react"

// Enhanced Card con hover effects
export const EnhancedCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Card> & {
    variant?: "default" | "gradient" | "glassmorphism" | "elevated" | "interactive"
    hover?: "lift" | "glow" | "scale" | "tilt" | "none"
    borderGradient?: boolean
    spotlight?: boolean
  }
>(({ className, variant = "default", hover = "lift", borderGradient = false, spotlight = false, children, ...props }, ref) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const variants = {
    default: "bg-white border border-gray-200",
    gradient: "bg-gradient-to-br from-white via-purple-50 to-blue-50 border border-purple-200",
    glassmorphism: "bg-white/70 backdrop-blur-md border border-white/30 shadow-lg",
    elevated: "bg-white border-0 shadow-xl",
    interactive: "bg-white border border-gray-200 cursor-pointer"
  }

  const hoverEffects = {
    lift: "hover:shadow-2xl hover:-translate-y-2",
    glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]",
    scale: "hover:scale-[1.02]",
    tilt: "hover:rotate-1 hover:scale-[1.02]",
    none: ""
  }

  return (
    <Card
      ref={ref}
      className={cn(
        "transition-all duration-300 ease-out relative overflow-hidden",
        variants[variant],
        hoverEffects[hover],
        borderGradient && "border-2 border-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-border p-[2px]",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Spotlight effect */}
      {spotlight && isHovered && (
        <div
          className="absolute pointer-events-none rounded-full opacity-30 transition-all duration-300"
          style={{
            background: `radial-gradient(circle 100px at ${mousePosition.x}px ${mousePosition.y}px, rgba(139,92,246,0.3), transparent)`,
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
          }}
        />
      )}

      {/* Gradient border overlay */}
      {borderGradient && (
        <div className="absolute inset-[2px] bg-white rounded-[calc(var(--radius)-2px)]">
          {children}
        </div>
      )}

      {!borderGradient && children}
    </Card>
  )
})
EnhancedCard.displayName = "EnhancedCard"

// Stats Card con animaciones
export const StatsCard = ({ 
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  variant = "default",
  className,
  animate = true,
  ...props
}: {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  variant?: "default" | "gradient" | "success" | "warning" | "danger"
  className?: string
  animate?: boolean
} & React.ComponentProps<typeof Card>) => {
  const [isVisible, setIsVisible] = useState(false)

  React.useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [animate])

  const variants = {
    default: "bg-white border-gray-200",
    gradient: "bg-gradient-to-br from-purple-500 to-blue-600 text-white border-0",
    success: "bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0",
    warning: "bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0",
    danger: "bg-gradient-to-br from-red-500 to-pink-600 text-white border-0"
  }

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />,
    neutral: <div className="w-4 h-4" />
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-500 transform hover:scale-105 hover:shadow-lg",
        variants[variant],
        animate && !isVisible && "opacity-0 translate-y-8",
        animate && isVisible && "opacity-100 translate-y-0",
        className
      )}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium",
              variant === "default" ? "text-gray-600" : "text-white/90"
            )}>
              {title}
            </p>
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-2xl font-bold",
                animate && "animate-in count-up"
              )}>
                {value}
              </span>
              {trend && trendValue && (
                <div className="flex items-center ml-3 text-sm">
                  {trendIcons[trend]}
                  <span className="ml-1">{trendValue}</span>
                </div>
              )}
            </div>
            {description && (
              <p className={cn(
                "text-xs mt-1",
                variant === "default" ? "text-gray-500" : "text-white/70"
              )}>
                {description}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "rounded-full p-3 transition-transform duration-300 hover:scale-110",
              variant === "default" ? "bg-gray-100" : "bg-white/20"
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Candidate Card mejorada
export const CandidateCard = ({ 
  candidate,
  votes,
  rank,
  isWinner = false,
  showVotes = true,
  onClick,
  className,
  ...props
}: {
  candidate: {
    id: string
    nombre: string
    apellido: string
    grado: string
    curso: string
  }
  votes?: number
  rank?: number
  isWinner?: boolean
  showVotes?: boolean
  onClick?: () => void
  className?: string
} & React.ComponentProps<typeof Card>) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <EnhancedCard
      className={cn(
        "transition-all duration-300 cursor-pointer relative",
        isWinner && "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/25",
        onClick && "hover:shadow-xl hover:-translate-y-1",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      spotlight={true}
      {...props}
    >
      {/* Winner badge */}
      {isWinner && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-2 shadow-lg animate-pulse">
            <Award className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Rank badge */}
      {rank && (
        <div className="absolute top-4 left-4 z-10">
          <Badge 
            variant={rank === 1 ? "default" : "secondary"}
            className={cn(
              "text-xs font-bold",
              rank === 1 && "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white",
              rank === 2 && "bg-gradient-to-r from-gray-300 to-gray-500 text-white",
              rank === 3 && "bg-gradient-to-r from-amber-600 to-amber-800 text-white"
            )}
          >
            #{rank}
          </Badge>
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {/* Avatar placeholder */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                isWinner ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : "bg-gradient-to-r from-purple-400 to-blue-500",
                isHovered && "scale-110"
              )}>
                <span className="text-white font-bold text-lg">
                  {candidate.nombre.charAt(0)}{candidate.apellido.charAt(0)}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  {candidate.nombre} {candidate.apellido}
                </h3>
                <p className="text-sm text-gray-600">
                  {candidate.grado} grado • {candidate.curso}
                </p>
              </div>
            </div>
          </div>

          {/* Votes section */}
          {showVotes && (
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {votes || 0}
                </span>
                <Star className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  votes && votes > 0 ? "text-yellow-500 fill-current" : "text-gray-300"
                )} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {votes === 1 ? "voto" : "votos"}
              </p>
            </div>
          )}

          {/* Hover arrow */}
          {onClick && (
            <ChevronRight className={cn(
              "w-5 h-5 text-gray-400 transition-all duration-300 ml-2",
              isHovered && "text-purple-600 translate-x-1"
            )} />
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}

// Progress Card para mostrar estadísticas con progreso
export const ProgressCard = ({
  title,
  current,
  total,
  percentage,
  icon,
  color = "purple",
  showNumbers = true,
  animated = true,
  className,
  ...props
}: {
  title: string
  current: number
  total: number
  percentage?: number
  icon?: React.ReactNode
  color?: "purple" | "blue" | "green" | "yellow" | "red"
  showNumbers?: boolean
  animated?: boolean
  className?: string
} & React.ComponentProps<typeof Card>) => {
  const [displayPercentage, setDisplayPercentage] = useState(0)
  const calculatedPercentage = percentage || (total > 0 ? (current / total) * 100 : 0)

  React.useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayPercentage(calculatedPercentage)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setDisplayPercentage(calculatedPercentage)
    }
  }, [calculatedPercentage, animated])

  const colors = {
    purple: "from-purple-500 to-purple-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600"
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {icon && (
            <div className={cn(
              "rounded-full p-2 bg-gradient-to-r",
              colors[color],
              "bg-opacity-10"
            )}>
              {icon}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {showNumbers && (
              <>
                <span className="text-gray-600">{current} de {total}</span>
                <span className="font-medium">{Math.round(displayPercentage)}%</span>
              </>
            )}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-full bg-gradient-to-r transition-all duration-1000 ease-out",
                colors[color]
              )}
              style={{ 
                width: animated ? `${displayPercentage}%` : `${calculatedPercentage}%`,
                transform: animated ? 'translateX(0)' : undefined
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Notification Card para alertas y mensajes
export const NotificationCard = ({
  type = "info",
  title,
  message,
  action,
  onDismiss,
  autoHide = false,
  hideDelay = 5000,
  className,
  ...props
}: {
  type?: "info" | "success" | "warning" | "error"
  title: string
  message: string
  action?: React.ReactNode
  onDismiss?: () => void
  autoHide?: boolean
  hideDelay?: number
  className?: string
} & React.ComponentProps<typeof Card>) => {
  const [isVisible, setIsVisible] = useState(true)

  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss?.(), 300)
      }, hideDelay)
      return () => clearTimeout(timer)
    }
  }, [autoHide, hideDelay, onDismiss])

  const types = {
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: "text-blue-600",
      title: "text-blue-900",
      message: "text-blue-800"
    },
    success: {
      bg: "bg-green-50 border-green-200",
      icon: "text-green-600",
      title: "text-green-900", 
      message: "text-green-800"
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: "text-yellow-600",
      title: "text-yellow-900",
      message: "text-yellow-800"
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: "text-red-600",
      title: "text-red-900",
      message: "text-red-800"
    }
  }

  const typeConfig = types[type]

  return (
    <Card
      className={cn(
        "transition-all duration-300 border",
        typeConfig.bg,
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        className
      )}
      {...props}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5", typeConfig.icon)}>
            {type === "success" && <Zap className="w-5 h-5" />}
            {type === "error" && <span className="text-lg">⚠️</span>}
            {type === "warning" && <span className="text-lg">⚠️</span>}
            {type === "info" && <span className="text-lg">ℹ️</span>}
          </div>
          
          <div className="flex-1">
            <h4 className={cn("font-semibold text-sm", typeConfig.title)}>
              {title}
            </h4>
            <p className={cn("text-sm mt-1", typeConfig.message)}>
              {message}
            </p>
            
            {action && (
              <div className="mt-3">
                {action}
              </div>
            )}
          </div>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                "text-gray-400 hover:text-gray-600 transition-colors duration-200",
                typeConfig.icon
              )}
            >
              ✕
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}