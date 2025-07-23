import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/period-status - Verificar estado de períodos activos
export async function GET(request: NextRequest) {
  try {
    // Buscar períodos activos
    const activePeriods = await prisma.votingPeriod.findMany({
      where: {
        active: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const currentDate = new Date()
    
    // Verificar si hay períodos activos y válidos por fecha
    const validActivePeriods = activePeriods.filter(period => {
      const startDate = new Date(period.startDate)
      const endDate = new Date(period.endDate)
      return currentDate >= startDate && currentDate <= endDate
    })

    const hasActivePeriod = validActivePeriods.length > 0
    const currentPeriod = validActivePeriods[0] || null

    // Obtener estadísticas del período actual si existe
    let periodStats = null
    if (currentPeriod) {
      const [totalVotes, totalCandidates] = await Promise.all([
        prisma.vote.count({
          where: {
            mes: currentPeriod.mes,
            ano: currentPeriod.ano
          }
        }),
        prisma.candidate.count({
          where: {
            active: true
          }
        })
      ])

      periodStats = {
        totalVotes,
        totalCandidates
      }
    }

    return NextResponse.json({
      success: true,
      hasActivePeriod,
      currentPeriod,
      periodStats,
      totalActivePeriods: activePeriods.length,
      validActivePeriods: validActivePeriods.length,
      message: hasActivePeriod 
        ? `Período activo: ${currentPeriod.mes} ${currentPeriod.ano}` 
        : 'No hay períodos de votación activos'
    })

  } catch (error) {
    console.error('Error al verificar estado de períodos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo verificar el estado de los períodos'
      },
      { status: 500 }
    )
  }
}