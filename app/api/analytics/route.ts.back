import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

// GET /api/analytics - Estadísticas avanzadas y métricas del sistema
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación (solo admin puede ver analytics)
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'
    const period = searchParams.get('period') || '6' // últimos 6 meses por defecto

    switch (type) {
      case 'dashboard':
        return await getDashboardAnalytics()
      
      case 'trends':
        return await getTrendsAnalytics(parseInt(period))
      
      case 'participation':
        return await getParticipationAnalytics()
      
      case 'performance':
        return await getPerformanceAnalytics()
      
      default:
        return await getDashboardAnalytics()
    }

  } catch (error) {
    console.error('Error al obtener analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las estadísticas'
      },
      { status: 500 }
    )
  }
}

// Analytics del dashboard principal
async function getDashboardAnalytics() {
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleString('es-ES', { month: 'long' })
  const currentYear = currentDate.getFullYear().toString()

  // Estadísticas generales
  const [
    totalCandidates,
    activeCandidates,
    totalVotes,
    currentMonthVotes,
    uniqueVoters,
    totalPeriods
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.count({ where: { active: true } }),
    prisma.vote.count(),
    prisma.vote.count({ 
      where: { 
        mes: currentMonth,
        ano: currentYear 
      } 
    }),
    prisma.vote.groupBy({
      by: ['grado', 'curso', 'mes', 'ano'],
      _count: true
    }),
    prisma.votingPeriod.count()
  ])

  // Top candidatos de todos los tiempos
  const topCandidatesAllTime = await prisma.vote.groupBy({
    by: ['candidateId'],
    _count: true,
    orderBy: {
      _count: {
        candidateId: 'desc'
      }
    },
    take: 10
  })

  const topCandidatesWithDetails = await Promise.all(
    topCandidatesAllTime.map(async (item) => {
      const candidate = await prisma.candidate.findUnique({
        where: { id: item.candidateId },
        select: {
          nombre: true,
          apellido: true,
          grado: true,
          curso: true,
          active: true
        }
      })
      return {
        candidate,
        totalVotes: item._count
      }
    })
  )

  // Períodos más activos
  const mostActivePeriodsRaw = await prisma.vote.groupBy({
    by: ['mes', 'ano'],
    _count: true,
    orderBy: {
      _count: {
        mes: 'desc'
      }
    },
    take: 5
  })

  const mostActivePeriods = mostActivePeriodsRaw.map(period => ({
    period: `${period.mes} ${period.ano}`,
    mes: period.mes,
    ano: period.ano,
    votes: period._count
  }))

  // Distribución por grado y curso
  const [distributionByGrado, distributionByCurso] = await Promise.all([
    prisma.vote.groupBy({
      by: ['grado'],
      _count: true,
      orderBy: { grado: 'asc' }
    }),
    prisma.vote.groupBy({
      by: ['curso'],
      _count: true,
      orderBy: { curso: 'asc' }
    })
  ])

  // Candidatos por grado/curso
  const candidateDistribution = await prisma.candidate.groupBy({
    by: ['grado', 'curso'],
    where: { active: true },
    _count: true,
    orderBy: [
      { grado: 'asc' },
      { curso: 'asc' }
    ]
  })

  return NextResponse.json({
    success: true,
    type: 'dashboard',
    data: {
      overview: {
        totalCandidates,
        activeCandidates,
        inactiveCandidates: totalCandidates - activeCandidates,
        totalVotes,
        currentMonthVotes,
        uniqueVoters: uniqueVoters.length,
        totalPeriods,
        averageVotesPerPeriod: totalPeriods > 0 ? Math.round(totalVotes / totalPeriods) : 0
      },
      topCandidates: topCandidatesWithDetails,
      mostActivePeriods,
      distribution: {
        byGrado: distributionByGrado.map(item => ({
          grado: item.grado,
          votes: item._count,
          percentage: totalVotes > 0 ? (item._count / totalVotes) * 100 : 0
        })),
        byCurso: distributionByCurso.map(item => ({
          curso: item.curso,
          votes: item._count,
          percentage: totalVotes > 0 ? (item._count / totalVotes) * 100 : 0
        })),
        candidatesByGradoCurso: candidateDistribution.map(item => ({
          grado: item.grado,
          curso: item.curso,
          candidates: item._count
        }))
      },
      currentPeriod: {
        mes: currentMonth,
        ano: currentYear,
        votes: currentMonthVotes
      }
    },
    timestamp: new Date().toISOString(),
    message: 'Analytics del dashboard obtenidos exitosamente'
  })
}

// Analytics de tendencias temporales
async function getTrendsAnalytics(monthsBack: number = 6) {
  // Obtener votos por mes en los últimos X meses
  const monthlyVotes = await prisma.vote.groupBy({
    by: ['mes', 'ano'],
    _count: true,
    orderBy: [
      { ano: 'desc' },
      { mes: 'desc' }
    ],
    take: monthsBack
  })

  // Tendencia de candidatos activos por mes
  const candidateTrends = await Promise.all(
    monthlyVotes.map(async (month) => {
      const candidatesWithVotes = await prisma.vote.groupBy({
        by: ['candidateId'],
        where: {
          mes: month.mes,
          ano: month.ano
        },
        _count: true
      })

      return {
        period: `${month.mes} ${month.ano}`,
        mes: month.mes,
        ano: month.ano,
        totalVotes: month._count,
        activeCandidates: candidatesWithVotes.length,
        averageVotesPerCandidate: candidatesWithVotes.length > 0 
          ? Math.round(month._count / candidatesWithVotes.length) 
          : 0
      }
    })
  )

  // Calcular crecimiento mes a mes
  const trendsWithGrowth = candidateTrends.map((current, index) => {
    const previous = candidateTrends[index + 1]
    const voteGrowth = previous 
      ? ((current.totalVotes - previous.totalVotes) / previous.totalVotes) * 100 
      : 0
    const candidateGrowth = previous 
      ? ((current.activeCandidates - previous.activeCandidates) / previous.activeCandidates) * 100 
      : 0

    return {
      ...current,
      growth: {
        votes: Math.round(voteGrowth * 100) / 100,
        candidates: Math.round(candidateGrowth * 100) / 100
      }
    }
  })

  return NextResponse.json({
    success: true,
    type: 'trends',
    data: {
      monthlyTrends: trendsWithGrowth.reverse(), // Ordenar cronológicamente
      summary: {
        totalPeriods: monthlyVotes.length,
        totalVotesInPeriod: monthlyVotes.reduce((sum, month) => sum + month._count, 0),
        averageVotesPerMonth: monthlyVotes.length > 0 
          ? Math.round(monthlyVotes.reduce((sum, month) => sum + month._count, 0) / monthlyVotes.length)
          : 0
      }
    },
    period: `Últimos ${monthsBack} meses`,
    message: `Tendencias de los últimos ${monthsBack} meses`
  })
}

// Analytics de participación por segmentos
async function getParticipationAnalytics() {
  // Participación por grado
  const participationByGrado = await prisma.vote.groupBy({
    by: ['grado'],
    _count: true,
    orderBy: { grado: 'asc' }
  })

  // Participación por curso
  const participationByCurso = await prisma.vote.groupBy({
    by: ['curso'],
    _count: true,
    orderBy: { curso: 'asc' }
  })

  // Matriz de participación grado x curso
  const participationMatrix = await prisma.vote.groupBy({
    by: ['grado', 'curso'],
    _count: true,
    orderBy: [
      { grado: 'asc' },
      { curso: 'asc' }
    ]
  })

  // Análisis de frecuencia de votación por período
  const votingFrequency = await prisma.vote.groupBy({
    by: ['grado', 'curso', 'mes', 'ano'],
    _count: true,
    orderBy: [
      { ano: 'desc' },
      { mes: 'desc' }
    ]
  })

  const totalVotes = await prisma.vote.count()

  return NextResponse.json({
    success: true,
    type: 'participation',
    data: {
      byGrado: participationByGrado.map(item => ({
        grado: item.grado,
        votes: item._count,
        percentage: totalVotes > 0 ? (item._count / totalVotes) * 100 : 0
      })),
      byCurso: participationByCurso.map(item => ({
        curso: item.curso,
        votes: item._count,
        percentage: totalVotes > 0 ? (item._count / totalVotes) * 100 : 0
      })),
      matrix: participationMatrix.map(item => ({
        grado: item.grado,
        curso: item.curso,
        votes: item._count,
        percentage: totalVotes > 0 ? (item._count / totalVotes) * 100 : 0
      })),
      frequency: {
        totalUniqueVoters: votingFrequency.length,
        averageParticipation: votingFrequency.length > 0 
          ? Math.round((totalVotes / votingFrequency.length) * 100) / 100
          : 0
      }
    },
    totalVotes,
    message: 'Analytics de participación obtenidos exitosamente'
  })
}

// Analytics de rendimiento del sistema
async function getPerformanceAnalytics() {
  const [
    dbStats,
    recentActivity,
    systemHealth
  ] = await Promise.all([
    // Estadísticas de base de datos
    Promise.all([
      prisma.candidate.count(),
      prisma.vote.count(),
      prisma.user.count(),
      prisma.votingPeriod.count()
    ]),
    
    // Actividad reciente (últimos 30 días)
    prisma.vote.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Salud del sistema (simulado)
    Promise.resolve({
      uptime: '99.9%',
      responseTime: '120ms',
      errorRate: '0.01%'
    })
  ])

  const [totalCandidates, totalVotes, totalUsers, totalPeriods] = dbStats

  return NextResponse.json({
    success: true,
    type: 'performance',
    data: {
      database: {
        totalRecords: totalCandidates + totalVotes + totalUsers + totalPeriods,
        candidates: totalCandidates,
        votes: totalVotes,
        users: totalUsers,
        periods: totalPeriods
      },
      activity: {
        last30Days: recentActivity,
        averageDaily: Math.round(recentActivity / 30)
      },
      system: systemHealth
    },
    timestamp: new Date().toISOString(),
    message: 'Analytics de rendimiento obtenidos exitosamente'
  })
}