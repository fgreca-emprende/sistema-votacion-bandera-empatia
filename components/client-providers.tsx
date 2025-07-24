// components/client-providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme/theme-provider"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}