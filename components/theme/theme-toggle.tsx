// components/theme/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Simple Theme Toggle Button
export function ThemeToggle({ 
  variant = "outline",
  size = "default",
  className 
}: {
  variant?: "outline" | "ghost" | "default"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className}>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "transition-all duration-300 hover:scale-105 active:scale-95",
        className
      )}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}

// Theme-aware gradient backgrounds
export function ThemeGradientBackground({ 
  children,
  variant = "default",
  className 
}: {
  children: React.ReactNode
  variant?: "default" | "purple" | "blue" | "green" | "warm"
  className?: string
}) {
  const variants = {
    default: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
    purple: "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20",
    blue: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
    green: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    warm: "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      variants[variant],
      className
    )}>
      {children}
    </div>
  )
}