// scripts/create-admin.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔍 Verificando usuario admin...')
    
    // Verificar si ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    })

    if (existingAdmin) {
      console.log('✅ Usuario admin ya existe:')
      console.log(`   ID: ${existingAdmin.id}`)
      console.log(`   Username: ${existingAdmin.username}`)
      console.log(`   Role: ${existingAdmin.role}`)
      console.log(`   Creado: ${existingAdmin.createdAt}`)
      return
    }

    console.log('❌ Usuario admin no existe. Creando...')

    // Crear hash de contraseña
    const hashedPassword = await bcrypt.hash('empathy2024', 12)

    // Crear usuario admin
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
      }
    })

    console.log('✅ Usuario admin creado exitosamente:')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Username: ${admin.username}`)
    console.log(`   Role: ${admin.role}`)
    console.log('   Password: empathy2024')

  } catch (error) {
    console.error('❌ Error al crear usuario admin:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()