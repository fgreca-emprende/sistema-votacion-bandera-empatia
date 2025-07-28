// components/ui/optimized-image.tsx - Componente imagen optimizado
"use client"

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ImageIcon, Loader2 } from 'lucide-react'

// Tipos para el componente
interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  className?: string
  containerClassName?: string
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait' | 'auto'
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  fallback?: React.ReactNode
  showLoadingSpinner?: boolean
}

// Aspectos de ratio predefinidos
const aspectRatios = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[16/9]',
  portrait: 'aspect-[3/4]',
  auto: ''
}

// Object fit classes
const objectFitClasses = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down'
}

/**
 * Componente de imagen optimizado con Next.js Image
 * Incluye lazy loading, responsive, WebP/AVIF automático, blur placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  className,
  containerClassName,
  aspectRatio = 'auto',
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallback,
  showLoadingSpinner = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Generar blur placeholder automático si no se proporciona
  const generateBlurDataURL = (w: number = 8, h: number = 8) => {
    const canvas = typeof window !== 'undefined' ? document.createElement('canvas') : null
    if (!canvas) return undefined
    
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    
    // Generar un gradiente sutil como placeholder
    const gradient = ctx.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
    
    return canvas.toDataURL()
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Fallback en caso de error
  if (hasError && fallback) {
    return <>{fallback}</>
  }

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg",
        aspectRatios[aspectRatio],
        containerClassName
      )}>
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Error al cargar imagen</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "relative overflow-hidden",
      aspectRatios[aspectRatio],
      containerClassName
    )}>
      {/* Loading spinner */}
      {isLoading && showLoadingSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || (placeholder === 'blur' ? generateBlurDataURL() : undefined)}
        sizes={sizes || (fill ? '100vw' : undefined)}
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-all duration-300',
          objectFitClasses[objectFit],
          isLoading ? 'scale-110 blur-sm' : 'scale-100 blur-0',
          className
        )}
        {...props}
      />
    </div>
  )
}

/**
 * Componente de avatar optimizado
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fallback,
  className,
  ...props
}: {
  src: string
  alt: string
  size?: number
  fallback?: string
  className?: string
} & Omit<OptimizedImageProps, 'width' | 'height' | 'aspectRatio'>) {
  const fallbackText = fallback || alt.charAt(0).toUpperCase()

  return (
    <div className={cn(
      "relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center",
      className
    )} style={{ width: size, height: size }}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        aspectRatio="square"
        objectFit="cover"
        containerClassName="w-full h-full"
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
            {fallbackText}
          </div>
        }
        {...props}
      />
    </div>
  )
}

/**
 * Componente de logo optimizado
 */
export function OptimizedLogo({
  src,
  alt = "Logo",
  width = 200,
  height = 50,
  priority = true,
  className,
  ...props
}: {
  src: string
  alt?: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
} & Omit<OptimizedImageProps, 'aspectRatio'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      objectFit="contain"
      placeholder="empty" // Los logos no necesitan blur
      className={cn("transition-transform duration-300 hover:scale-105", className)}
      {...props}
    />
  )
}

/**
 * Galería de imágenes optimizada
 */
export function OptimizedGallery({
  images,
  columns = 3,
  gap = 4,
  aspectRatio = 'square',
  className
}: {
  images: Array<{ src: string; alt: string; caption?: string }>
  columns?: number
  gap?: number
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait'
  className?: string
}) {
  return (
    <div 
      className={cn(
        "grid gap-4",
        className
      )}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {images.map((image, index) => (
        <div key={index} className="group">
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            fill
            sizes={`(max-width: 768px) 100vw, (max-width: 1200px) ${100/columns}vw, ${100/columns}vw`}
            aspectRatio={aspectRatio}
            className="group-hover:scale-105 transition-transform duration-300"
            containerClassName="cursor-pointer"
          />
          {image.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}