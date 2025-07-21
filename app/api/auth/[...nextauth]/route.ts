import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { PrismaAdapter } from "@auth/prisma-adapter"

const prisma = new PrismaClient()

const handler = NextAuth({
  // Configurar adaptador Prisma
  adapter: PrismaAdapter(prisma),
  
  // Configurar providers
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { 
          label: "Usuario", 
          type: "text", 
          placeholder: "admin" 
        },
        password: { 
          label: "Contraseña", 
          type: "password" 
        }
      },
      async authorize(credentials) {
        // Validar que existan credenciales
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Credenciales requeridas")
        }

        try {
          // Buscar usuario en base de datos
          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username
            }
          })

          // Si no existe el usuario
          if (!user) {
            throw new Error("Usuario no encontrado")
          }

          // Verificar contraseña
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error("Contraseña incorrecta")
          }

          // Retornar datos del usuario
          return {
            id: user.id,
            username: user.username,
            role: user.role,
          }
        } catch (error) {
          console.error("Error en autenticación:", error)
          return null
        }
      }
    })
  ],

  // Configurar session
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Configurar JWT
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Callbacks para personalizar JWT y sesión
  callbacks: {
    async jwt({ token, user, account }) {
      // Incluir datos adicionales en el token
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    
    async session({ session, token }) {
      // Incluir datos del token en la sesión
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.username = token.username
      }
      return session
    },

    async signIn({ user, account, profile }) {
      // Personalizar lógica de sign-in si es necesario
      return true
    }
  },

  // Páginas personalizadas
  pages: {
    signIn: '/auth/signin',    // Página personalizada de login
    error: '/auth/error',      // Página de errores
  },

  // Eventos y debugging
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('Usuario autenticado:', user.username)
    },
    async signOut({ session, token }) {
      console.log('Usuario cerró sesión')
    }
  },

  // Configuración de debugging (solo desarrollo)
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }