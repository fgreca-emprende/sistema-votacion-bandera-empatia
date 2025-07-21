import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

// Schema de validación para actualizar candidato
const candidateUpdateSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido").trim().optional(),
  apellido: z.string().min(1, "Apellido es requerido").trim().optional(),
  grado: z.enum(["1ro", "2do", "3ro", "4to", "5to", "6to"]).optional(),
  curso: z.enum(["Arrayan", "Jacarandá", "Ceibo"]).optional(),
  active: z.boolean().optional(),
})

// GET /api/candidates/[id] - Obtener candidato específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        grado: true,
        curso: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        votes: {
          select: {
            id: true,
            mes: true,
            ano: true,
            timestamp: true,
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidato no encontrado',
          message: `No existe un candidato con ID: ${id}`
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: candidate
    })

  } catch (error) {
    console.error('Error al obtener candidato:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el candidato'
      },
      { status: 500 }
    )
  }
}

// PUT /api/candidates/[id] - Actualizar candidato específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Validar datos
    const validation = candidateUpdateSchema.safeParse(body)
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

    // Verificar que el candidato existe
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id }
    })

    if (!existingCandidate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidato no encontrado',
          message: `No existe un candidato con ID: ${id}`
        },
        { status: 404 }
      )
    }

    // Si se están actualizando nombre, apellido, grado o curso, verificar duplicados
    if (validatedData.nombre || validatedData.apellido || validatedData.grado || validatedData.curso) {
      const updatedData = {
        nombre: validatedData.nombre ?? existingCandidate.nombre,
        apellido: validatedData.apellido ?? existingCandidate.apellido,
        grado: validatedData.grado ?? existingCandidate.grado,
        curso: validatedData.curso ?? existingCandidate.curso,
      }

      const duplicate = await prisma.candidate.findFirst({
        where: {
          id: { not: id }, // Excluir el candidato actual
          nombre: {
            equals: updatedData.nombre,
            mode: 'insensitive'
          },
          apellido: {
            equals: updatedData.apellido,
            mode: 'insensitive'
          },
          grado: updatedData.grado,
          curso: updatedData.curso,
          active: true
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Candidato duplicado',
            message: `Ya existe otro candidato con estos datos: ${updatedData.nombre} ${updatedData.apellido} en ${updatedData.grado} - ${updatedData.curso}`,
            existing: {
              id: duplicate.id,
              nombre: duplicate.nombre,
              apellido: duplicate.apellido,
              grado: duplicate.grado,
              curso: duplicate.curso
            }
          },
          { status: 409 }
        )
      }
    }

    // Actualizar candidato
    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: validatedData,
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
      data: updatedCandidate,
      message: `Candidato ${updatedCandidate.nombre} ${updatedCandidate.apellido} actualizado exitosamente`
    })

  } catch (error) {
    console.error('Error al actualizar candidato:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el candidato'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/candidates/[id] - Eliminar candidato (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Verificar que el candidato existe
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        votes: true
      }
    })

    if (!existingCandidate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidato no encontrado',
          message: `No existe un candidato con ID: ${id}`
        },
        { status: 404 }
      )
    }

    // Verificar si el candidato tiene votos
    const hasVotes = existingCandidate.votes.length > 0

    if (hasVotes) {
      // Si tiene votos, hacer soft delete (marcar como inactivo)
      const deactivatedCandidate = await prisma.candidate.update({
        where: { id },
        data: { active: false },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          grado: true,
          curso: true,
          active: true,
        }
      })

      return NextResponse.json({
        success: true,
        data: deactivatedCandidate,
        message: `Candidato ${deactivatedCandidate.nombre} ${deactivatedCandidate.apellido} desactivado (tiene votos asociados)`,
        warning: 'El candidato fue desactivado en lugar de eliminado porque tiene votos asociados'
      })
    } else {
      // Si no tiene votos, eliminar completamente
      await prisma.candidate.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        data: {
          id,
          nombre: existingCandidate.nombre,
          apellido: existingCandidate.apellido,
          grado: existingCandidate.grado,
          curso: existingCandidate.curso
        },
        message: `Candidato ${existingCandidate.nombre} ${existingCandidate.apellido} eliminado completamente`
      })
    }

  } catch (error) {
    console.error('Error al eliminar candidato:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el candidato'
      },
      { status: 500 }
    )
  }
}