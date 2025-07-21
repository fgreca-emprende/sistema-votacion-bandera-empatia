import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema de validación para votos
const voteSchema = z.object({
  candidateId: z.string().min(1, "ID del candidato es requerido"),
  grado: z.enum(["1ro", "2do", "3ro", "4to", "5to", "6to"], {
    errorMap: () => ({ message: "Grado debe ser válido" })
  }),
  curso: z.enum(["Arrayan", "Jacarandá", "Ceibo"], {
    errorMap: () => ({ message: "Curso debe ser válido" })
  }),
  mes: z.string().min(1, "Mes es requerido"),
  ano: z.string().min(4, "Año es requerido").max(4, "Año debe tener 4 dígitos"),
})

// GET /api/votes - Obtener votos y resultados (con filtros)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const ano = searchParams.get('ano')
    const grado = searchParams.get('grado')
    const curso = searchParams.get('curso')
    const format = searchParams.get('format') || 'results' // 'results' o 'raw'

    // Validar parámetros requeridos
    if (!mes || !ano) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros requeridos',
          message: 'Mes y año son obligatorios'
        },
        { status: 400 }
      )
    }

    // Construir filtros dinámicos
    const where: any = {
      mes,
      ano,
    }
    
    if (grado) where.grado = grado
    if (curso) where.curso = curso

    if (format === 'raw') {
      // Retornar votos sin procesar
      const votes = await prisma.vote.findMany({
        where,
        include: {
          candidate: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              grado: true,
              curso: true,
              active: true,
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      return NextResponse.json({
        success: true,
        data: votes,
        count: votes.length,
        period: { mes, ano },
        filters: { grado, curso }
      })
    }

    // Formato de resultados (por defecto)
    const votes = await prisma.vote.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            grado: true,
            curso: true,
            active: true,
          }
        }
      }
    })

    // Agrupar votos por candidato
    const candidateVotes = votes.reduce((acc, vote) => {
      const candidateId = vote.candidateId
      if (!acc[candidateId]) {
        acc[candidateId] = {
          candidate: vote.candidate,
          votes: 0,
          percentage: 0
        }
      }
      acc[candidateId].votes++
      return acc
    }, {} as Record<string, any>)

    // Convertir a array y calcular porcentajes
    const results = Object.values(candidateVotes)
    const totalVotes = results.reduce((sum: number, result: any) => sum + result.votes, 0)

    // Calcular porcentajes
    results.forEach((result: any) => {
      result.percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0
    })

    // Ordenar por número de votos (descendente)
    results.sort((a: any, b: any) => b.votes - a.votes)

    // Estadísticas adicionales
    const stats = {
      totalVotes,
      totalCandidates: results.length,
      period: { mes, ano },
      filters: { grado, curso },
      winner: results.length > 0 ? results[0] : null
    }

    return NextResponse.json({
      success: true,
      data: results,
      stats,
      message: `Resultados para ${mes} ${ano}${grado ? ` - ${grado}` : ''}${curso ? ` - ${curso}` : ''}`
    })

  } catch (error) {
    console.error('Error al obtener votos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los resultados'
      },
      { status: 500 }
    )
  }
}

// POST /api/votes - Registrar nuevo voto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos
    const validation = voteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos',
          details: validation.error.errors,
          message: 'Los datos del voto no son válidos'
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Verificar que el candidato existe y está activo
    const candidate = await prisma.candidate.findUnique({
      where: { 
        id: validatedData.candidateId 
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        grado: true,
        curso: true,
        active: true,
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidato no encontrado',
          message: 'El candidato seleccionado no existe'
        },
        { status: 404 }
      )
    }

    if (!candidate.active) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidato inactivo',
          message: 'El candidato seleccionado no está disponible para votación'
        },
        { status: 400 }
      )
    }

    // Verificar que el candidato pertenece al grado y curso especificados
    if (candidate.grado !== validatedData.grado || candidate.curso !== validatedData.curso) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidato no válido',
          message: `El candidato ${candidate.nombre} ${candidate.apellido} no pertenece a ${validatedData.grado} - ${validatedData.curso}`
        },
        { status: 400 }
      )
    }

    // Verificar si ya existe un voto para este grado/curso/mes/año
    const existingVote = await prisma.vote.findUnique({
      where: {
        grado_curso_mes_ano: {
          grado: validatedData.grado,
          curso: validatedData.curso,
          mes: validatedData.mes,
          ano: validatedData.ano,
        }
      },
      include: {
        candidate: {
          select: {
            nombre: true,
            apellido: true,
          }
        }
      }
    })

    if (existingVote) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Voto duplicado',
          message: `Ya se registró un voto para ${validatedData.grado} - ${validatedData.curso} en ${validatedData.mes} ${validatedData.ano}`,
          existingVote: {
            candidate: existingVote.candidate,
            timestamp: existingVote.timestamp,
            period: `${existingVote.mes} ${existingVote.ano}`
          }
        },
        { status: 409 }
      )
    }

    // Registrar el voto
    const vote = await prisma.vote.create({
      data: validatedData,
      include: {
        candidate: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            grado: true,
            curso: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: vote.id,
        candidate: vote.candidate,
        period: `${vote.mes} ${vote.ano}`,
        timestamp: vote.timestamp,
        grado: vote.grado,
        curso: vote.curso
      },
      message: `¡Voto registrado exitosamente! Has votado por ${vote.candidate.nombre} ${vote.candidate.apellido} para ${vote.mes} ${vote.ano}`
    }, { status: 201 })

  } catch (error) {
    console.error('Error al registrar voto:', error)
    
    // Manejar errores específicos de Prisma
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Voto duplicado',
          message: 'Ya has votado para este período'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo registrar el voto'
      },
      { status: 500 }
    )
  }
}

// PUT /api/votes - Verificar si ya se votó (sin registrar voto)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { grado, curso, mes, ano } = body

    // Validar parámetros
    if (!grado || !curso || !mes || !ano) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros requeridos',
          message: 'Grado, curso, mes y año son obligatorios'
        },
        { status: 400 }
      )
    }

    // Verificar si ya existe un voto
    const existingVote = await prisma.vote.findUnique({
      where: {
        grado_curso_mes_ano: {
          grado,
          curso,
          mes,
          ano,
        }
      },
      include: {
        candidate: {
          select: {
            nombre: true,
            apellido: true,
          }
        }
      }
    })

    if (existingVote) {
      return NextResponse.json({
        success: true,
        hasVoted: true,
        data: {
          candidate: existingVote.candidate,
          timestamp: existingVote.timestamp,
          period: `${existingVote.mes} ${existingVote.ano}`,
          grado: existingVote.grado,
          curso: existingVote.curso
        },
        message: `Ya votaste por ${existingVote.candidate.nombre} ${existingVote.candidate.apellido} en ${existingVote.mes} ${existingVote.ano}`
      })
    }

    return NextResponse.json({
      success: true,
      hasVoted: false,
      message: `No hay votos registrados para ${grado} - ${curso} en ${mes} ${ano}`
    })

  } catch (error) {
    console.error('Error al verificar voto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo verificar el estado del voto'
      },
      { status: 500 }
    )
  }
}