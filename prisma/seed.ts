import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Crear usuario administrador por defecto
  const hashedPassword = await bcrypt.hash('empathy2024', 12)
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Crear algunos candidatos de ejemplo
  const candidatesData = [
    { nombre: 'Juan', apellido: 'Pérez', grado: '1ro', curso: 'Arrayan' },
    { nombre: 'María', apellido: 'González', grado: '1ro', curso: 'Arrayan' },
    { nombre: 'Carlos', apellido: 'Rodríguez', grado: '2do', curso: 'Jacarandá' },
  ]

  for (const candidate of candidatesData) {
    await prisma.candidate.upsert({
      where: {
        nombre_apellido_grado_curso: {
          nombre: candidate.nombre,
          apellido: candidate.apellido,
          grado: candidate.grado,
          curso: candidate.curso,
        }
      },
      update: {},
      create: candidate,
    })
  }

  console.log('Seed completado!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })