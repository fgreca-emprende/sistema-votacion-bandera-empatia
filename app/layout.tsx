import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Sistema de votacion bandera empatia',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />  {/* 🔥 AGREGAR ESTA LÍNEA */}
        </Providers>
      </body>
    </html>
  )
}