// app/api/db-health/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test básico de conexión
    const startTime = Date.now()
    await prisma.$connect()
    const connectionTime = Date.now() - startTime

    // Test de consulta simple
    const queryStartTime = Date.now()
    const userCount = await prisma.user.count()
    const candidateCount = await prisma.candidate.count()
    const voteCount = await prisma.vote.count()
    const queryTime = Date.now() - queryStartTime

    // Información de la base de datos
    const dbInfo = await prisma.$queryRaw`SELECT version()` as any[]
    const dbVersion = dbInfo[0]?.version || 'Desconocido'

    // Variables de entorno (sin mostrar datos sensibles)
    const databaseUrl = process.env.DATABASE_URL
    const isLocalhost = databaseUrl?.includes('localhost') || databaseUrl?.includes('127.0.0.1')
    const isPrismaAccelerate = databaseUrl?.includes('prisma-data.net')
    const isVercelPostgres = databaseUrl?.includes('db.prisma.io')

    return NextResponse.json({
      success: true,
      status: 'CONNECTED',
      database: {
        version: dbVersion,
        connectionTime: `${connectionTime}ms`,
        queryTime: `${queryTime}ms`,
        environment: isLocalhost ? 'LOCAL' : 'PRODUCTION',
        provider: isPrismaAccelerate ? 'Prisma Accelerate' : 
                 isVercelPostgres ? 'Vercel Postgres' : 'PostgreSQL',
        url: {
          isLocal: isLocalhost,
          isPrismaAccelerate,
          isVercelPostgres,
          host: databaseUrl ? new URL(databaseUrl.split('?')[0]).hostname : 'Unknown'
        }
      },
      tables: {
        users: userCount,
        candidates: candidateCount,
        votes: voteCount
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database connection error:', error)
    
    return NextResponse.json({
      success: false,
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Error desconocido',
      database: {
        environment: 'UNKNOWN',
        provider: 'UNKNOWN'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
    
  } finally {
    await prisma.$disconnect()
  }
}