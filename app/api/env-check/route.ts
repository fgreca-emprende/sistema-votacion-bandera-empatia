// app/api/env-check/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    variables: {
      DATABASE_URL: {
        exists: !!databaseUrl,
        isLocal: databaseUrl?.includes('localhost') || databaseUrl?.includes('127.0.0.1'),
        isPrismaAccelerate: databaseUrl?.includes('prisma-data.net'),
        isVercelPostgres: databaseUrl?.includes('db.prisma.io'),
        host: databaseUrl ? new URL(databaseUrl.split('?')[0]).hostname : null
      },
      NEXTAUTH_SECRET: {
        exists: !!nextAuthSecret,
        length: nextAuthSecret?.length || 0
      },
      NEXTAUTH_URL: {
        exists: !!nextAuthUrl,
        value: nextAuthUrl
      }
    },
    timestamp: new Date().toISOString()
  })
}