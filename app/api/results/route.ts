import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema de validación para filtros de resultados
const resultsQuerySchema = z.object({
  mes: z.string().optional(),
  ano: z.string().optional(),
  grado: z.string().optional(),
  curso: z.string().optional(),
  type: z.enum(['summary', 'detailed', 'historical', 'comparison']).default('summary'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
})

// GET /api/results - Obtener resultados y estadísticas avanzadas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validar parámetros
    const validation = resultsQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros inválidos',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { mes, ano, grado, curso, type, limit, offset } = validation.data

    switch (type) {
      case 'summary':
        return await getSummaryResults(mes, ano, grado, curso)
      
      case 'detailed':
        return await getDetailedResults(mes, ano, grado, curso, limit, offset)
      
      case 'historical':
        return await getHistoricalResults(grado, curso, limit)
      
      case 'comparison':
        return await getComparisonResults(mes, ano)
      
      default:
        return await getSummaryResults(mes, ano, grado, curso)
    }

  } catch (error) {
    console.error('Error al obtener resultados:', error)
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

// Resultados resumidos (compatible con tu página actual)
async function getSummaryResults(mes?: string, ano?: string, grado?: string, curso?: string) {
  // Construir filtros
  const where: any = {}
  if (mes) where.mes = mes
  if (ano) where.ano = ano
  if (grado) where.grado = grado
  if (curso) where.curso = curso

  // Obtener votos con candidatos
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

  // Tipos para el agrupamiento de votos por candidato
  interface CandidateVoteData {
    candidate: any;
    votes: number;
    percentage: number;
    details: {
      grados: { [key: string]: number };
      cursos: { [key: string]: number };
      meses: { [key: string]: number };
    };
  }

  // Agrupar por candidato
  const candidateVotes: Record<string, CandidateVoteData> = votes.reduce((acc, vote) => {
    const candidateId = vote.candidateId
    if (!acc[candidateId]) {
      acc[candidateId] = {
        candidate: vote.candidate,
        votes: 0,
        percentage: 0,
        details: {
          grados: {},
          cursos: {},
          meses: {}
        }
      }
    }
    acc[candidateId].votes++
    
    // Agregar detalles por categoría
    acc[candidateId].details.grados[vote.grado] = (acc[candidateId].details.grados[vote.grado] || 0) + 1
    acc[candidateId].details.cursos[vote.curso] = (acc[candidateId].details.cursos[vote.curso] || 0) + 1
    acc[candidateId].details.meses[vote.mes] = (acc[candidateId].details.meses[vote.mes] || 0) + 1
    
    return acc
  }, {} as Record<string, CandidateVoteData>)

  // Convertir a array y calcular estadísticas
  const results: CandidateVoteData[] = Object.values(candidateVotes)
  const totalVotes = votes.length
  
  // Calcular porcentajes
  results.forEach((result) => {
    result.percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0
  })

  // Ordenar por votos
  results.sort((a, b) => b.votes - a.votes)

  // Tipos para las estadísticas de participación
  interface ParticipationStats {
    [key: string]: number;
  }

  // Estadísticas generales
  const stats = {
    totalVotes,
    totalCandidates: results.length,
    candidatesWithVotes: results.filter((r: any) => r.votes > 0).length,
    period: { mes, ano },
    filters: { grado, curso },
    winner: results.length > 0 ? results[0] : null,
    participation: {
      byGrado: {} as ParticipationStats,
      byCurso: {} as ParticipationStats,
      byMes: {} as ParticipationStats
    }
  }

  // Calcular participación por categorías
  votes.forEach(vote => {
    stats.participation.byGrado[vote.grado] = (stats.participation.byGrado[vote.grado] || 0) + 1
    stats.participation.byCurso[vote.curso] = (stats.participation.byCurso[vote.curso] || 0) + 1
    stats.participation.byMes[vote.mes] = (stats.participation.byMes[vote.mes] || 0) + 1
  })

  return NextResponse.json({
    success: true,
    type: 'summary',
    data: results,
    stats,
    message: `Resultados para ${mes || 'todos los meses'} ${ano || 'todos los años'}${grado ? ` - ${grado}` : ''}${curso ? ` - ${curso}` : ''}`
  })
}

// Resultados detallados con paginación
async function getDetailedResults(mes?: string, ano?: string, grado?: string, curso?: string, limit = 50, offset = 0) {
  const where: any = {}
  if (mes) where.mes = mes
  if (ano) where.ano = ano
  if (grado) where.grado = grado
  if (curso) where.curso = curso

  // Obtener votos individuales con paginación
  const [votes, totalCount] = await Promise.all([
    prisma.vote.findMany({
      where,
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
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset,
    }),
    prisma.vote.count({ where })
  ])

  return NextResponse.json({
    success: true,
    type: 'detailed',
    data: votes,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
      nextOffset: offset + limit < totalCount ? offset + limit : null
    },
    message: `${votes.length} votos detallados`
  })
}

// Resultados históricos (tendencias por período)
async function getHistoricalResults(grado?: string, curso?: string, limit = 12) {
  const where: any = {}
  if (grado) where.grado = grado
  if (curso) where.curso = curso

  // Obtener todos los períodos únicos
  const periods = await prisma.vote.groupBy({
    by: ['mes', 'ano'],
    where,
    orderBy: [
      { ano: 'desc' },
      { mes: 'desc' }
    ],
    take: limit
  })

  // Para cada período, obtener estadísticas
  const historicalData = await Promise.all(
    periods.map(async (period) => {
      const periodWhere = {
        ...where,
        mes: period.mes,
        ano: period.ano
      }

      const [votes, topCandidate] = await Promise.all([
        prisma.vote.count({ where: periodWhere }),
        prisma.vote.groupBy({
          by: ['candidateId'],
          where: periodWhere,
          _count: true,
          orderBy: {
            _count: {
              candidateId: 'desc'
            }
          },
          take: 1
        })
      ])

      let winnerInfo = null
      if (topCandidate.length > 0) {
        const candidate = await prisma.candidate.findUnique({
          where: { id: topCandidate[0].candidateId },
          select: {
            nombre: true,
            apellido: true,
            grado: true,
            curso: true
          }
        })
        winnerInfo = {
          candidate,
          votes: topCandidate[0]._count
        }
      }

      return {
        period: `${period.mes} ${period.ano}`,
        mes: period.mes,
        ano: period.ano,
        totalVotes: votes,
        winner: winnerInfo
      }
    })
  )

  return NextResponse.json({
    success: true,
    type: 'historical',
    data: historicalData,
    filters: { grado, curso },
    message: `Historial de ${historicalData.length} períodos`
  })
}

// Comparación entre grados/cursos para un período específico
async function getComparisonResults(mes?: string, ano?: string) {
  if (!mes || !ano) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Parámetros requeridos',
        message: 'Mes y año son obligatorios para comparaciones'
      },
      { status: 400 }
    )
  }

  const where = { mes, ano }

  // Estadísticas por grado
  const byGrado = await prisma.vote.groupBy({
    by: ['grado'],
    where,
    _count: true,
    orderBy: {
      _count: {
        grado: 'desc'
      }
    }
  })

  // Estadísticas por curso
  const byCurso = await prisma.vote.groupBy({
    by: ['curso'],
    where,
    _count: true,
    orderBy: {
      _count: {
        curso: 'desc'
      }
    }
  })

  // Participación por grado y curso combinados
  const byGradoCurso = await prisma.vote.groupBy({
    by: ['grado', 'curso'],
    where,
    _count: true,
    orderBy: [
      { grado: 'asc' },
      { curso: 'asc' }
    ]
  })

  // Calcular porcentajes
  const totalVotes = await prisma.vote.count({ where })

  const gradosWithPercentage = byGrado.map(item => ({
    grado: item.grado,
    votes: item._count,
    percentage: totalVotes > 0 ? (item._count / totalVotes) * 100 : 0
  }))

  const cursosWithPercentage = byCurso.map(item => ({
    curso: item.curso,
    votes: item._count,
    percentage: totalVotes > 0 ? (item._count / totalVotes) * 100 : 0
  }))

  const gradoCursoWithPercentage = byGradoCurso.map(item => ({
    grado: item.grado,
    curso: item.curso,
    votes: item._count,
    percentage: totalVotes > 0 ? (item._count / totalVotes) * 100 : 0
  }))

  return NextResponse.json({
    success: true,
    type: 'comparison',
    data: {
      byGrado: gradosWithPercentage,
      byCurso: cursosWithPercentage,
      byGradoCurso: gradoCursoWithPercentage,
      totalVotes
    },
    period: { mes, ano },
    message: `Comparación para ${mes} ${ano}`
  })
}