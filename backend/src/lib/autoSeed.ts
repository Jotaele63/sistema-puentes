import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const usuarios = [
  { email: 'admin@puentes.com',      nombre: 'Admin',   apellido: 'Sistema',   rol: 'ADMIN',       area: 'ADMIN'        },
  { email: 'gerente@puentes.com',    nombre: 'Carlos',  apellido: 'Rodríguez', rol: 'GERENTE',     area: 'OPERACIONES'  },
  { email: 'jefe.turno@puentes.com', nombre: 'María',   apellido: 'González',  rol: 'JEFE_TURNO',  area: 'OPERACIONES'  },
  { email: 'jefe.mant@puentes.com',  nombre: 'Pedro',   apellido: 'Martínez',  rol: 'JEFE_AREA',   area: 'MANTENIMIENTO'},
  { email: 'jefe.ops@puentes.com',   nombre: 'Ana',     apellido: 'López',     rol: 'JEFE_AREA',   area: 'OPERACIONES'  },
  { email: 'jefe.seg@puentes.com',   nombre: 'Luis',    apellido: 'García',    rol: 'JEFE_AREA',   area: 'SEGURIDAD'    },
  { email: 'auditor@puentes.com',    nombre: 'Elena',   apellido: 'Sánchez',   rol: 'AUDITOR',     area: 'SEGURIDAD'    },
  { email: 'operario1@puentes.com',  nombre: 'Juan',    apellido: 'Pérez',     rol: 'SOLICITANTE', area: 'MANTENIMIENTO'},
  { email: 'operario2@puentes.com',  nombre: 'Roberto', apellido: 'Díaz',      rol: 'SOLICITANTE', area: 'OPERACIONES'  },
];

export async function autoSeed(): Promise<void> {
  const count = await prisma.usuario.count();
  if (count > 0) return; // Ya está inicializado

  const hash = await bcrypt.hash('password123', 10);
  for (const u of usuarios) {
    await prisma.usuario.create({ data: { ...u, password: hash } });
  }
  console.log('✅ Base de datos inicializada con usuarios de prueba');
  console.log('   Contraseña de todos: password123');
}
