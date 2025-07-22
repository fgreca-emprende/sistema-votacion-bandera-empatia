// app/api/setup-admin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Verificar que no existe ya un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        OR: [
          { username: 'admin' },
          { role: 'ADMIN' }
        ]
      }
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Usuario admin ya existe',
        existingUser: {
          id: existingAdmin.id,
          username: existingAdmin.username,
          role: existingAdmin.role
        }
      }, { status: 400 })
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('empathy2024', 12)
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        email: 'admin@empathy.com' // Opcional pero útil
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario admin creado exitosamente',
      data: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        credentials: {
          username: 'admin',
          password: 'empathy2024'
        }
      }
    })

  } catch (error) {
    console.error('Error creando admin:', error)
    return NextResponse.json({
      success: false,
      message: 'Error al crear usuario admin',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para crear el usuario admin',
    instructions: 'Envía una petición POST a este endpoint para crear el usuario admin',
    credentials: {
      username: 'admin',
      password: 'empathy2024'
    }
  })
}