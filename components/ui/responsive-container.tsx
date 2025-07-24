// components/ui/responsive-container.tsx
"use client"

import React from "react"
import { cn } from "@/lib/utils"

// Responsive Container con breakpoints personalizados
export function ResponsiveContainer({ 
  children,
  maxWidth = "7xl",
  padding = "default",
  className,
  ...props
}: {
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full"
  padding?: "none" | "sm" | "default" | "lg" | "xl"
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  
  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full"
  }

  const paddings = {
    none: "",
    sm: "px-2 sm:px-4",
    default: "px-4 sm:px-6 lg:px-8",
    lg: "px-6 sm:px-8 lg:px-12",
    xl: "px-8 sm:px-12 lg:px-16"
  }

  return (
    <div 
      className={cn(
        "mx-auto w-full",
        maxWidths[maxWidth],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Responsive Grid con auto-fit
export function ResponsiveGrid({ 
  children,
  minItemWidth = "300px",
  gap = "default",
  className,
  ...props
}: {
  children: React.ReactNode
  minItemWidth?: string
  gap?: "none" | "sm" | "default" | "lg" | "xl"
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  
  const gaps = {
    none: "gap-0",
    sm: "gap-2 sm:gap-3",
    default: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
    xl: "gap-8 sm:gap-10"
  }

  return (
    <div 
      className={cn(
        "grid w-full",
        gaps[gap],
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}, 100%), 1fr))`
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Responsive Stack (Flexbox utility)
export function ResponsiveStack({ 
  children,
  direction = "column",
  align = "stretch",
  justify = "start",
  gap = "default",
  wrap = false,
  breakpoint = "md",
  reverseOnMobile = false,
  className,
  ...props
}: {
  children: React.ReactNode
  direction?: "row" | "column"
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  gap?: "none" | "sm" | "default" | "lg" | "xl"
  wrap?: boolean
  breakpoint?: "sm" | "md" | "lg" | "xl"
  reverseOnMobile?: boolean
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  
  const directions = {
    row: "flex-row",
    column: "flex-col"
  }

  const alignments = {
    start: "items-start",
    center: "items-center", 
    end: "items-end",
    stretch: "items-stretch"
  }

  const justifications = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end", 
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly"
  }

  const gaps = {
    none: "gap-0",
    sm: "gap-2 sm:gap-3",
    default: "gap-4 sm:gap-6", 
    lg: "gap-6 sm:gap-8",
    xl: "gap-8 sm:gap-10"
  }

  const responsiveDirection = direction === "row" 
    ? `flex-col ${breakpoint}:flex-row`
    : `flex-row ${breakpoint}:flex-col`

  return (
    <div 
      className={cn(
        "flex",
        responsiveDirection,
        alignments[align],
        justifications[justify],
        gaps[gap],
        wrap && "flex-wrap",
        reverseOnMobile && "flex-col-reverse sm:flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Responsive Hide/Show utilities
export function ResponsiveShow({ 
  children,
  breakpoint = "md",
  className 
}: {
  children: React.ReactNode
  breakpoint?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
}) {
  const breakpoints = {
    sm: "hidden sm:block",
    md: "hidden md:block", 
    lg: "hidden lg:block",
    xl: "hidden xl:block",
    "2xl": "hidden 2xl:block"
  }

  return (
    <div className={cn(breakpoints[breakpoint], className)}>
      {children}
    </div>
  )
}

export function ResponsiveHide({ 
  children,
  breakpoint = "md",
  className 
}: {
  children: React.ReactNode
  breakpoint?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
}) {
  const breakpoints = {
    sm: "block sm:hidden",
    md: "block md:hidden",
    lg: "block lg:hidden", 
    xl: "block xl:hidden",
    "2xl": "block 2xl:hidden"
  }

  return (
    <div className={cn(breakpoints[breakpoint], className)}>
      {children}
    </div>
  )
}

// Responsive Text utilities
export function ResponsiveText({ 
  children,
  size = "default",
  weight = "normal",
  className,
  ...props
}: {
  children: React.ReactNode
  size?: "xs" | "sm" | "default" | "lg" | "xl" | "2xl" | "3xl"
  weight?: "light" | "normal" | "medium" | "semibold" | "bold"
  className?: string
} & React.HTMLAttributes<HTMLElement>) {
  
  const sizes = {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base",
    default: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl", 
    "2xl": "text-2xl sm:text-3xl",
    "3xl": "text-3xl sm:text-4xl lg:text-5xl"
  }

  const weights = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium", 
    semibold: "font-semibold",
    bold: "font-bold"
  }

  return (
    <p 
      className={cn(
        sizes[size],
        weights[weight],
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

// Responsive Spacing utility
export function ResponsiveSpacing({ 
  children,
  spacing = "default",
  direction = "vertical",
  className,
  ...props
}: {
  children: React.ReactNode
  spacing?: "none" | "sm" | "default" | "lg" | "xl" | "2xl"
  direction?: "vertical" | "horizontal" | "all"
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  
  const verticalSpacing = {
    none: "space-y-0",
    sm: "space-y-2 sm:space-y-3",
    default: "space-y-4 sm:space-y-6",
    lg: "space-y-6 sm:space-y-8", 
    xl: "space-y-8 sm:space-y-10",
    "2xl": "space-y-10 sm:space-y-12"
  }

  const horizontalSpacing = {
    none: "space-x-0",
    sm: "space-x-2 sm:space-x-3",
    default: "space-x-4 sm:space-x-6",
    lg: "space-x-6 sm:space-x-8",
    xl: "space-x-8 sm:space-x-10",
    "2xl": "space-x-10 sm:space-x-12"
  }

  const allSpacing = {
    none: "gap-0",
    sm: "gap-2 sm:gap-3",
    default: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
    xl: "gap-8 sm:gap-10",
    "2xl": "gap-10 sm:gap-12"
  }

  const spacingClass = direction === "vertical" 
    ? verticalSpacing[spacing]
    : direction === "horizontal"
    ? horizontalSpacing[spacing]
    : allSpacing[spacing]

  return (
    <div 
      className={cn(
        direction === "all" ? "flex flex-col" : "",
        spacingClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Mobile-first responsive layout
export function MobileFirstLayout({ 
  children,
  sidebar,
  header,
  footer,
  sidebarWidth = "64",
  collapsible = true,
  className 
}: {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  sidebarWidth?: "48" | "56" | "64" | "72" | "80"
  collapsible?: boolean
  className?: string
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const widths = {
    "48": "w-48",
    "56": "w-56", 
    "64": "w-64",
    "72": "w-72",
    "80": "w-80"
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", className)}>
      {/* Mobile sidebar overlay */}
      {sidebar && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className={cn(
            "absolute left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300",
            widths[sidebarWidth],
            "translate-x-0"
          )}>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Desktop sidebar */}
        {sidebar && (
          <div className={cn(
            "hidden lg:flex lg:flex-shrink-0",
            widths[sidebarWidth]
          )}>
            <div className="flex flex-col w-full">
              {sidebar}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          {header && (
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-4 py-3">
                {/* Mobile menu button */}
                {sidebar && collapsible && (
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
                {header}
              </div>
            </header>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            {children}
          </main>

          {/* Footer */}
          {footer && (
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}

// Responsive Card Grid
export function ResponsiveCardGrid({ 
  children,
  minCardWidth = "280px",
  maxCardWidth = "400px", 
  gap = "default",
  className,
  ...props
}: {
  children: React.ReactNode
  minCardWidth?: string
  maxCardWidth?: string
  gap?: "none" | "sm" | "default" | "lg" | "xl"
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  
  const gaps = {
    none: "gap-0",
    sm: "gap-3 sm:gap-4",
    default: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
    xl: "gap-8 sm:gap-10"
  }

  return (
    <div 
      className={cn(
        "grid w-full",
        gaps[gap],
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${minCardWidth}, 100%), 1fr))`,
        gridAutoRows: "min-content"
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Responsive Breakpoint Hook
export function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg')
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < 640) {
        setBreakpoint('sm')
        setIsMobile(true)
      } else if (width < 768) {
        setBreakpoint('md') 
        setIsMobile(true)
      } else if (width < 1024) {
        setBreakpoint('lg')
        setIsMobile(false)
      } else if (width < 1280) {
        setBreakpoint('xl')
        setIsMobile(false)
      } else {
        setBreakpoint('2xl')
        setIsMobile(false)
      }
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile,
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),
    isSmall: breakpoint === 'sm',
    isMedium: breakpoint === 'md',
    isLarge: breakpoint === 'lg',
    isXLarge: breakpoint === 'xl',
    is2XLarge: breakpoint === '2xl'
  }
}

// Responsive Image component
export function ResponsiveImage({ 
  src,
  alt,
  sizes = "100vw",
  priority = false,
  className,
  aspectRatio = "auto",
  objectFit = "cover",
  placeholder = "blur",
  ...props
}: {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
  aspectRatio?: "auto" | "square" | "video" | "wide" | "portrait"
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
  placeholder?: "blur" | "empty"
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  
  const aspectRatios = {
    auto: "",
    square: "aspect-square",
    video: "aspect-video", 
    wide: "aspect-[16/9]",
    portrait: "aspect-[3/4]"
  }

  const objectFits = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill", 
    none: "object-none",
    "scale-down": "object-scale-down"
  }

  return (
    <div className={cn(
      "relative overflow-hidden",
      aspectRatios[aspectRatio],
      className
    )}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full transition-transform duration-300 hover:scale-105",
          objectFits[objectFit]
        )}
        loading={priority ? "eager" : "lazy"}
        {...props}
      />
    </div>
  )
}

// Responsive Video component
export function ResponsiveVideo({ 
  src,
  poster,
  aspectRatio = "video",
  autoPlay = false,
  muted = true,
  controls = true,
  className,
  ...props
}: {
  src: string
  poster?: string
  aspectRatio?: "video" | "square" | "wide"
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
  className?: string
} & React.VideoHTMLAttributes<HTMLVideoElement>) {
  
  const aspectRatios = {
    video: "aspect-video",
    square: "aspect-square", 
    wide: "aspect-[21/9]"
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg",
      aspectRatios[aspectRatio],
      className
    )}>
      <video
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        className="w-full h-full object-cover"
        {...props}
      />
    </div>
  )
}