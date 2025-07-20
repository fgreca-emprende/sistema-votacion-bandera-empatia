"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeOff } from "lucide-react"

interface AdminLoginProps {
  onLogin: (success: boolean) => void
  onCancel: () => void
}

export default function AdminLogin({ onLogin, onCancel }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    setLoginError("")

    // Simular delay de autenticación
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Credenciales por defecto (en producción deberían estar en variables de entorno)
    const validUsername = "admin"
    const validPassword = "empathy2024"

    if (credentials.username === validUsername && credentials.password === validPassword) {
      onLogin(true)
    } else {
      setLoginError("Usuario o contraseña incorrectos")
      onLogin(false)
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">Acceso de Administrador</CardTitle>
          <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Usuario:</label>
            <Input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="Ingresa tu usuario"
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Contraseña:</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Ingresa tu contraseña"
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{loginError}</p>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Credenciales por defecto:</strong>
              <br />
              Usuario: admin
              <br />
              Contraseña: empathy2024
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={!credentials.username || !credentials.password || isLoading}
            className="w-full h-12"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verificando...
              </div>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>

          <Button onClick={onCancel} className="w-full" variant="ghost" disabled={isLoading}>
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
