// app/auth/signin/page.tsx - Código completo con mejoras visuales
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Lock, Eye, EyeOff, ArrowLeft, Shield, Key, User, 
  Crown, Sparkles, CheckCircle, AlertTriangle 
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle, ThemeGradientBackground } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

export default function SignInPage() {
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        username: credentials.username,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "Error de autenticación",
          description: "Usuario o contraseña incorrectos",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login exitoso",
          description: "Bienvenido al panel administrativo",
        })
        
        // Redirigir al panel admin
        router.push('/admin')
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al iniciar sesión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = credentials.username && credentials.password

  return (
    <ThemeGradientBackground variant="blue">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Formulario principal mejorado */}
          <Card className="animate-in fade-in-up duration-500 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                <div className="absolute inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse opacity-30"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center shadow-xl">
                  <Shield className="w-10 h-10 text-white animate-float" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Acceso de Administrador
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                Ingresa tus credenciales para acceder al panel de gestión
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Campo Usuario */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Usuario <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="Ingresa tu nombre de usuario"
                      disabled={isLoading}
                      required
                      className="h-12 pl-12 transition-all duration-300 hover:shadow-md focus:shadow-lg border-2 focus:border-blue-400"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-600" />
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Ingresa tu contraseña"
                      disabled={isLoading}
                      className="h-12 pl-12 pr-12 transition-all duration-300 hover:shadow-md focus:shadow-lg border-2 focus:border-purple-400"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent transition-all duration-300 hover:scale-110"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Información de credenciales mejorada */}
                <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          Credenciales por defecto:
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-blue-600" />
                            <span className="text-blue-700 dark:text-blue-300">
                              <strong>Usuario:</strong> admin
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Key className="w-3 h-3 text-blue-600" />
                            <span className="text-blue-700 dark:text-blue-300">
                              <strong>Contraseña:</strong> empathy2024
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Validación visual */}
                {!isFormValid && credentials.username === "" && credentials.password === "" && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 animate-pulse" />
                      <div>
                        <p className="text-yellow-800 dark:text-yellow-200 font-semibold text-sm">
                          Campos requeridos
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                          Completa todos los campos para continuar
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de login mejorado */}
                <Button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className={cn(
                    "w-full h-14 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl",
                    isFormValid 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" 
                      : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      </div>
                      <span>Verificando credenciales...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5" />
                      <span>Iniciar Sesión</span>
                    </div>
                  )}
                </Button>

                {/* Botón volver mejorado */}
                <Button 
                  type="button"
                  onClick={() => router.push('/')} 
                  className="w-full h-12 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transition-all duration-300 hover:scale-105" 
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Card informativa adicional */}
          <Card className="animate-in slide-in-from-bottom duration-500 animation-delay-300 shadow-xl border-0 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
                <Crown className="w-6 h-6 text-blue-500 animate-bounce" />
                <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Panel de Administración
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Accede al sistema de gestión para administrar candidatos, períodos de votación 
                y consultar estadísticas detalladas de la Bandera de la Empatía.
              </p>
              
              {/* Features list */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Gestión de candidatos y votaciones</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Dashboard analytics avanzado</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Control de períodos activos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Floating theme toggle */}
        <div className="fixed bottom-6 right-6 animate-in slide-in-from-right duration-500 animation-delay-1000">
          <ThemeToggle />
        </div>
      </div>
    </ThemeGradientBackground>
  )
}