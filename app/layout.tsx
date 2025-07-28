// app/layout.tsx - Layout mejorado con providers separados
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

// ✅ Metadata SIN viewport
export const metadata: Metadata = {
  title: "Sistema Bandera de la Empatía",
  description: "Sistema de votación escolar mensual para reconocer la bondad y empatía en nuestra comunidad educativa",
  keywords: ["votación", "escolar", "empatía", "estudiantes", "reconocimiento"],
  authors: [{ name: "Sistema Educativo" }],
  robots: "index, follow",
  icons: {
    icon: '/placeholder-logo.svg',
    shortcut: '/placeholder-logo.svg',
    apple: '/placeholder-logo.svg',
  },
}

// ✅ Viewport SEPARADO
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}