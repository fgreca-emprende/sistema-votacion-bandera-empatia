import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

// Schema de validación para períodos de votación
const votingPeriodSchema = z.object({
  mes: z.string().min(1, "Mes es requerido"),
  ano: z.string().min(4, "Año es requerido").max(4, "Año debe tener 4 dígitos"),
  active: z.boolean().default(false),
  startDate: z.string().datetime("Fecha de inicio debe ser válida"),
  endDate: z.string().datetime("Fecha de fin debe ser válida"),
})

const votingPeriodUpdateSchema = votingPeriodSchema.partial()

// GET /api/voting-periods - Obtener períodos de votación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const mes = searchParams.get('mes')
    const ano = searchParams.get('ano')

    // Construir filtros dinámicos
    const where: any = {}
    
    if (active !== null) where.active = active === 'true'
    if (mes) where.mes = mes
    if (ano) where.ano = ano

    const periods = await prisma.votingPeriod.findMany({
      where,
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Agregar información adicional sobre cada período
    const periodsWithStats = await Promise.all(
      periods.map(async (period) => {
        // Contar votos para este período
        const voteCount = await prisma.vote.count({
          where: {
            mes: period.mes,
            ano: period.ano
          }
        })

        // Contar candidatos únicos que recibieron votos
        const uniqueCandidates = await prisma.vote.findMany({
          where: {
            mes: period.mes,
            ano: period.ano
          },
          select: {
            candidateId: true
          },
          distinct: ['candidateId']
        })

        return {
          ...period,
          stats: {
            totalVotes: voteCount,
            candidatesWithVotes: uniqueCandidates.length
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: periodsWithStats,
      count: periodsWithStats.length
    })

  } catch (error) {
    console.error('Error al obtener períodos de votación:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los períodos de votación'
      },
      { status: 500 }
    )
  }
}

// POST /api/voting-periods - Crear nuevo período de votación
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación (solo admin)
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos
    const validation = votingPeriodSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Validar que la fecha de fin sea posterior a la de inicio
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    if (endDate <= startDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Fechas inválidas',
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        },
        { status: 400 }
      )
    }

    // Verificar si ya existe un período para este mes/año
    const existing = await prisma.votingPeriod.findUnique({
      where: {
        mes_ano: {
          mes: validatedData.mes,
          ano: validatedData.ano
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Período duplicado',
          message: `Ya existe un período de votación para ${validatedData.mes} ${validatedData.ano}`,
          existing: {
            id: existing.id,
            mes: existing.mes,
            ano: existing.ano,
            active: existing.active
          }
        },
        { status: 409 }
      )
    }

    // Si se está marcando como activo, desactivar otros períodos activos
    if (validatedData.active) {
      await prisma.votingPeriod.updateMany({
        where: { active: true },
        data: { active: false }
      })
    }

    // Crear período de votación
    const period = await prisma.votingPeriod.create({
      data: {
        mes: validatedData.mes,
        ano: validatedData.ano,
        active: validatedData.active,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
      }
    })

    return NextResponse.json({
      success: true,
      data: period,
      message: `Período de votación para ${period.mes} ${period.ano} creado exitosamente`
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear período:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo crear el período de votación'
      },
      { status: 500 }
    )
  }
}

// PUT /api/voting-periods - Activar/desactivar período de votación
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, active } = body

    if (!id || typeof active !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros requeridos',
          message: 'ID del período y estado activo son obligatorios'
        },
        { status: 400 }
      )
    }

    // Verificar que el período existe
    const existingPeriod = await prisma.votingPeriod.findUnique({
      where: { id }
    })

    if (!existingPeriod) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Período no encontrado',
          message: `No existe un período con ID: ${id}`
        },
        { status: 404 }
      )
    }

    // Si se está activando, desactivar otros períodos
    if (active) {
      await prisma.votingPeriod.updateMany({
        where: { 
          id: { not: id },
          active: true 
        },
        data: { active: false }
      })
    }

    // Actualizar el período
    const updatedPeriod = await prisma.votingPeriod.update({
      where: { id },
      data: { active }
    })

    return NextResponse.json({
      success: true,
      data: updatedPeriod,
      message: `Período ${updatedPeriod.mes} ${updatedPeriod.ano} ${active ? 'activado' : 'desactivado'} exitosamente`
    })

  } catch (error) {
    console.error('Error al actualizar período:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el período'
      },
      { status: 500 }
    )
  }
}