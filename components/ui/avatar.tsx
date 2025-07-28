// components/ui/avatar.tsx - Avatar optimizado con Next.js Image
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

// Versión alternativa más robusta (si necesitas manejar Blobs)
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    width?: number
    height?: number
    priority?: boolean
  }
>(({ className, src, alt, width = 40, height = 40, priority = false, ...props }, ref) => {
  // Manejar diferentes tipos de src
  const getImageSrc = (source: string | Blob | null | undefined): string | null => {
    if (!source) return null
    
    if (typeof source === 'string') {
      return source
    }
    
    if (source instanceof Blob) {
      return URL.createObjectURL(source)
    }
    
    return null
  }

  const imageSrc = getImageSrc(src)
  
  if (!imageSrc) {
    return null
  }

  return (
    <AvatarPrimitive.Image ref={ref} asChild className={cn("aspect-square h-full w-full", className)} {...props}>
      <Image
        src={imageSrc}
        alt={alt || "Avatar"}
        width={width}
        height={height}
        priority={priority}
        quality={90}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        className="object-cover transition-transform duration-300 group-hover:scale-110"
        sizes="(max-width: 768px) 40px, 40px"
        onError={() => {
          // Limpiar object URL si es necesario
          if (imageSrc.startsWith('blob:')) {
            URL.revokeObjectURL(imageSrc)
          }
        }}
      />
    </AvatarPrimitive.Image>
  )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm transition-colors duration-300",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }