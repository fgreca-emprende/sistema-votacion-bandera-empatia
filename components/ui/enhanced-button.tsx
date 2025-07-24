// components/ui/enhanced-button.tsx
"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2, ChevronRight, Sparkles } from "lucide-react"

// Enhanced Button con micro-animaciones
export const EnhancedButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "gradient"
    loadingText?: string
    successText?: string
    successIcon?: React.ReactNode
    haptic?: boolean
    ripple?: boolean
    glow?: boolean
  }
>(({ 
  className, 
  variant = "default", 
  children, 
  disabled, 
  loadingText = "Cargando...",
  successText,
  successIcon = <Check className="w-4 h-4" />,
  haptic = false,
  ripple = true,
  glow = false,
  onClick,
  ...props 
}, ref) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [rippleCoords, setRippleCoords] = useState<{x: number, y: number} | null>(null)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return

    // Haptic feedback (solo en dispositivos compatibles)
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }

    // Ripple effect
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect()
      setRippleCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setTimeout(() => setRippleCoords(null), 600)
    }

    if (onClick) {
      setIsLoading(true)
      try {
        await onClick(e)
        if (successText) {
          setIsSuccess(true)
          setTimeout(() => setIsSuccess(false), 2000)
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  const variants = {
    default: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95",
    gradient: "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95 bg-[length:200%_100%] hover:bg-right",
    destructive: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transform transition-all duration-200 hover:scale-105 active:scale-95",
    outline: "border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 transform transition-all duration-200 hover:scale-105 active:scale-95",
    secondary: "bg-gray-100 hover:bg-gray-200 transform transition-all duration-200 hover:scale-105 active:scale-95",
    ghost: "hover:bg-gray-100 transform transition-all duration-200 hover:scale-105 active:scale-95",
    link: "text-purple-600 hover:text-purple-800 underline-offset-4 hover:underline transform transition-all duration-200"
  }

  return (
    <Button
      ref={ref}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        variants[variant as keyof typeof variants] || variants.default,
        glow && "shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]",
        isSuccess && "!bg-gradient-to-r !from-green-500 !to-emerald-600",
        className
      )}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effect */}
      {rippleCoords && (
        <span
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: rippleCoords.x - 10,
            top: rippleCoords.y - 10,
            width: 20,
            height: 20,
          }}
        />
      )}

      {/* Content */}
      <span className="flex items-center gap-2 relative z-10">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText}
          </>
        ) : isSuccess && successText ? (
          <>
            {successIcon}
            {successText}
          </>
        ) : (
          children
        )}
      </span>

      {/* Glow effect overlay */}
      {glow && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
      )}
    </Button>
  )
})
EnhancedButton.displayName = "EnhancedButton"

// Floating Action Button con animaciones
export const FloatingActionButton = ({ 
  icon,
  onClick,
  className,
  variant = "primary",
  size = "default",
  tooltip,
  disabled = false,
  ...props
}: {
  icon: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary" | "success" | "danger"
  size?: "sm" | "default" | "lg"
  tooltip?: string
  disabled?: boolean
}) => {
  const [isPressed, setIsPressed] = useState(false)

  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white",
    secondary: "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
  }

  const sizes = {
    sm: "w-10 h-10",
    default: "w-12 h-12",
    lg: "w-14 h-14"
  }

  return (
    <div className="relative group">
      <button
        className={cn(
          "rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center",
          "hover:rotate-12 focus:outline-none focus:ring-4 focus:ring-purple-300/50",
          variants[variant],
          sizes[size],
          isPressed && "scale-95",
          disabled && "opacity-50 cursor-not-allowed hover:scale-100 hover:rotate-0",
          className
        )}
        onClick={onClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        disabled={disabled}
        title={tooltip}
        {...props}
      >
        <span className="transform transition-transform duration-200 group-hover:scale-110">
          {icon}
        </span>
      </button>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  )
}

// Button with progress indicator
export const ProgressButton = ({ 
  children,
  progress = 0,
  showProgress = false,
  variant = "default",
  className,
  ...props
}: {
  children: React.ReactNode
  progress?: number
  showProgress?: boolean
  variant?: "default" | "success" | "gradient"
  className?: string
} & React.ComponentProps<typeof Button>) => {
  return (
    <Button
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        variant === "gradient" && "bg-gradient-to-r from-purple-600 to-blue-600 text-white",
        variant === "success" && "bg-green-600 hover:bg-green-700 text-white",
        className
      )}
      {...props}
    >
      {/* Progress bar */}
      {showProgress && (
        <div
          className="absolute inset-0 bg-white/20 transition-all duration-300 ease-out"
          style={{ transform: `translateX(${progress - 100}%)` }}
        />
      )}
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Button>
  )
}

// Smart Submit Button (común en formularios)
export const SmartSubmitButton = ({
  children,
  isSubmitting = false,
  isSuccess = false,
  isError = false,
  submittingText = "Enviando...",
  successText = "¡Enviado!",
  errorText = "Error",
  resetDelay = 3000,
  className,
  ...props
}: {
  children: React.ReactNode
  isSubmitting?: boolean
  isSuccess?: boolean
  isError?: boolean
  submittingText?: string
  successText?: string
  errorText?: string
  resetDelay?: number
  className?: string
} & Omit<React.ComponentProps<typeof Button>, 'children'>) => {
  
  React.useEffect(() => {
    if (isSuccess || isError) {
      const timer = setTimeout(() => {
        // El componente padre debería manejar el reset
      }, resetDelay)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, isError, resetDelay])

  return (
    <Button
      className={cn(
        "transition-all duration-300 transform",
        isSuccess && "bg-green-600 hover:bg-green-600 text-white scale-105",
        isError && "bg-red-600 hover:bg-red-600 text-white animate-shake",
        className
      )}
      disabled={isSubmitting || isSuccess}
      {...props}
    >
      <span className="flex items-center gap-2">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {submittingText}
          </>
        ) : isSuccess ? (
          <>
            <Check className="w-4 h-4" />
            {successText}
          </>
        ) : isError ? (
          <>
            <X className="w-4 h-4" />
            {errorText}
          </>
        ) : (
          children
        )}
      </span>
    </Button>
  )
}