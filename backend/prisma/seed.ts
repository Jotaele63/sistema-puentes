import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const usuarios = [
    { email: 'admin@puentes.com', nombre: 'Admin', apellido: 'Sistema', rol: 'ADMIN', area: 'ADMIN' },
    { email: 'gerente@puentes.com', nombre: 'Carlos', apellido: 'Rodríguez', rol: 'GERENTE', area: 'OPERACIONES' },
    { email: 'jefe.turno@puentes.com', nombre: 'María', apellido: 'González', rol: 'JEFE_TURNO', area: 'OPERACIONES' },
    { email: 'jefe.mant@puentes.com', nombre: 'Pedro', apellido: 'Martínez', rol: 'JEFE_AREA', area: 'MANTENIMIENTO' },
    { email: 'jefe.ops@puentes.com', nombre: 'Ana', apellido: 'López', rol: 'JEFE_AREA', area: 'OPERACIONES' },
    { email: 'jefe.seg@puentes.com', nombre: 'Luis', apellido: 'García', rol: 'JEFE_AREA', area: 'SEGURIDAD' },
    { email: 'auditor@puentes.com', nombre: 'Elena', apellido: 'Sánchez', rol: 'AUDITOR', area: 'SEGURIDAD' },
    { email: 'operario1@puentes.com', nombre: 'Juan', apellido: 'Pérez', rol: 'SOLICITANTE', area: 'MANTENIMIENTO' },
    { email: 'operario2@puentes.com', nombre: 'Roberto', apellido: 'Díaz', rol: 'SOLICITANTE', area: 'OPERACIONES' },
  ];

  for (const u of usuarios) {
    const hash = await bcrypt.hash('password123', 10);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash }
    });
    console.log(`✅ Usuario: ${u.email}`);
  }

  console.log('\n✅ Seed completado!');
  console.log('\n📋 Usuarios creados:');
  console.log('   admin@puentes.com / password123 → ADMIN');
  console.log('   gerente@puentes.com / password123 → GERENTE');
  console.log('   jefe.turno@puentes.com / password123 → JEFE_TURNO');
  console.log('   jefe.mant@puentes.com / password123 → JEFE_ÁREA (Mantenimiento)');
  console.log('   auditor@puentes.com / password123 → AUDITOR');
  console.log('   operario1@puentes.com / password123 → SOLICITANTE');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
