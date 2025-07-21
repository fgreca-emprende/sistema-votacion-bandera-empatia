import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

// Schema de validación para candidatos
const candidateSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido").trim(),
  apellido: z.string().min(1, "Apellido es requerido").trim(),
  grado: z.enum(["1ro", "2do", "3ro", "4to", "5to", "6to"], {
    errorMap: () => ({ message: "Grado debe ser válido" })
  }),
  curso: z.enum(["Arrayan", "Jacarandá", "Ceibo"], {
    errorMap: () => ({ message: "Curso debe ser válido" })
  }),
})

const candidateUpdateSchema = candidateSchema.partial()

// GET /api/candidates - Obtener candidatos (con filtros opcionales)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grado = searchParams.get('grado')
    const curso = searchParams.get('curso')
    const active = searchParams.get('active')

    // Construir filtros dinámicos
    const where: any = {}
    
    if (grado) where.grado = grado
    if (curso) where.curso = curso
    if (active !== null) where.active = active === 'true'

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: [
        { grado: 'asc' },
        { curso: 'asc' },
        { apellido: 'asc' },
        { nombre: 'asc' }
      ],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        grado: true,
        curso: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: candidates,
      count: candidates.length
    })

  } catch (error) {
    console.error('Error al obtener candidatos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los candidatos'
      },
      { status: 500 }
    )
  }
}

// POST /api/candidates - Crear nuevo candidato
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación (solo admin puede crear candidatos)
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No autorizado',
          message: 'Debes estar autenticado para realizar esta acción'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos
    const validation = candidateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos',
          details: validation.error.errors,
          message: 'Los datos del candidato no son válidos'
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Verificar si ya existe un candidato con los mismos datos
    const existing = await prisma.candidate.findFirst({
      where: {
        nombre: {
          equals: validatedData.nombre,
          mode: 'insensitive'
        },
        apellido: {
          equals: validatedData.apellido,
          mode: 'insensitive'
        },
        grado: validatedData.grado,
        curso: validatedData.curso,
        active: true
      }
    })

    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidato duplicado',
          message: `${validatedData.nombre} ${validatedData.apellido} ya existe en ${validatedData.grado} - ${validatedData.curso}`,
          existing: {
            id: existing.id,
            nombre: existing.nombre,
            apellido: existing.apellido,
            grado: existing.grado,
            curso: existing.curso
          }
        },
        { status: 409 }
      )
    }

    // Crear candidato
    const candidate = await prisma.candidate.create({
      data: {
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        grado: validatedData.grado,
        curso: validatedData.curso,
        active: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        grado: true,
        curso: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: candidate,
      message: `Candidato ${candidate.nombre} ${candidate.apellido} creado exitosamente`
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear candidato:', error)
    
    // Manejar errores específicos de Prisma
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidato duplicado',
          message: 'Ya existe un candidato con estos datos'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo crear el candidato'
      },
      { status: 500 }
    )
  }
}

// PUT /api/candidates - Actualizar candidato (bulk update para Excel)
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
    const { candidates: candidatesData } = body

    if (!Array.isArray(candidatesData)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos',
          message: 'Se esperaba un array de candidatos'
        },
        { status: 400 }
      )
    }

    // Definir tipos para los resultados
    interface CreatedResult {
      index: number;
      data: {
        id: string;
        nombre: string;
        apellido: string;
        grado: string;
        curso: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    }

    interface DuplicateResult {
      index: number;
      data: {
        nombre: string;
        apellido: string;
        grado: "1ro" | "2do" | "3ro" | "4to" | "5to" | "6to";
        curso: "Arrayan" | "Jacarandá" | "Ceibo";
      };
      existing: {
        id: string;
        nombre: string;
        apellido: string;
        grado: string;
        curso: string;
      };
    }

    interface ErrorResult {
      index: number;
      data: any;
      error: string;
      details: any;
    }

    const results: {
      created: CreatedResult[];
      duplicates: DuplicateResult[];
      errors: ErrorResult[];
    } = {
      created: [],
      duplicates: [],
      errors: []
    }

    // Procesar cada candidato
    for (let i = 0; i < candidatesData.length; i++) {
      const candidateData = candidatesData[i]
      
      try {
        // Validar datos
        const validation = candidateSchema.safeParse(candidateData)
        if (!validation.success) {
          results.errors.push({
            index: i + 1,
            data: candidateData,
            error: 'Datos inválidos',
            details: validation.error.errors
          })
          continue
        }

        const validatedData = validation.data

        // Verificar duplicados
        const existing = await prisma.candidate.findFirst({
          where: {
            nombre: {
              equals: validatedData.nombre,
              mode: 'insensitive'
            },
            apellido: {
              equals: validatedData.apellido,
              mode: 'insensitive'
            },
            grado: validatedData.grado,
            curso: validatedData.curso,
            active: true
          }
        })

        if (existing) {
          results.duplicates.push({
            index: i + 1,
            data: validatedData,
            existing: {
              id: existing.id,
              nombre: existing.nombre,
              apellido: existing.apellido,
              grado: existing.grado,
              curso: existing.curso
            }
          } as DuplicateResult)
          continue
        }

        // Crear candidato
        const candidate = await prisma.candidate.create({
          data: {
            nombre: validatedData.nombre,
            apellido: validatedData.apellido,
            grado: validatedData.grado,
            curso: validatedData.curso,
            active: true
          }
        })

        results.created.push({
          index: i + 1,
          data: candidate
        } as CreatedResult)

      } catch (error) {
        results.errors.push({
          index: i + 1,
          data: candidateData,
          error: 'Error al procesar',
          details: error instanceof Error ? error.message : 'Error desconocido'
        } as ErrorResult)
      }
    }

    // Preparar respuesta
    const summary = {
      total: candidatesData.length,
      created: results.created.length,
      duplicates: results.duplicates.length,
      errors: results.errors.length
    }

    let message = `Procesamiento completado: ${summary.created} candidatos creados`
    if (summary.duplicates > 0) {
      message += `, ${summary.duplicates} duplicados omitidos`
    }
    if (summary.errors > 0) {
      message += `, ${summary.errors} errores`
    }

    return NextResponse.json({
      success: true,
      data: results,
      summary,
      message
    })

  } catch (error) {
    console.error('Error en carga masiva:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'Error en la carga masiva de candidatos'
      },
      { status: 500 }
    )
  }
}