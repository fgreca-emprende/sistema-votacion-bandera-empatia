// components/providers.tsx - Todos los providers unificados
"use client"

import { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { queryClient } from '@/lib/react-query'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster />
          
          {/* React Query DevTools solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false} 
              position="bottom"
              buttonPosition="bottom-right"
            />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}