import { Request, Response } from 'express';
import { format } from 'date-fns';
import { prisma } from '../lib/prisma';
import { generarPDFPuente } from '../services/pdf.service';
import { sendEmail, emailNuevoPuente, emailAprobado, emailRechazado } from '../services/email.service';

function generarNumeroRegistro(): string {
  const fecha = format(new Date(), 'yyyyMMdd');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `REG-${fecha}-${rand}`;
}

function diasParaExpiracion(estado: string): number {
  if (estado === 'APROBADO_NIVEL_1') return 3;
  if (estado === 'APROBADO_NIVEL_2') return 7;
  if (estado === 'APROBADO_NIVEL_3') return 7;
  return 0;
}

export async function listarPuentes(req: Request, res: Response): Promise<void> {
  const { estado, tipo, area, buscar, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const user = req.user!;

  const where: Record<string, unknown> = {};
  if (estado) where.estado = estado;
  if (tipo) where.tipo = tipo;
  if (buscar) {
    where.OR = [
      { numeroRegistro: { contains: buscar as string } },
      { elementoAForzar: { contains: buscar as string } },
      { equipo: { contains: buscar as string } },
    ];
  }

  if (user.rol === 'SOLICITANTE') {
    where.creadoPorId = user.userId;
  } else if (user.rol === 'JEFE_TURNO' || user.rol === 'JEFE_AREA') {
    if (area) where.creadoPor = { area };
  }

  const [puentes, total] = await Promise.all([
    prisma.puente.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { creadoEn: 'desc' },
      include: {
        creadoPor: { select: { nombre: true, apellido: true, area: true } },
        aprobaciones: {
          include: { aprobador: { select: { nombre: true, apellido: true } } },
          orderBy: { fecha: 'desc' }
        }
      }
    }),
    prisma.puente.count({ where })
  ]);

  res.json({ data: puentes, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
}

export async function obtenerPuente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const puente = await prisma.puente.findUnique({
    where: { id },
    include: {
      creadoPor: { select: { id: true, nombre: true, apellido: true, area: true, email: true } },
      aprobaciones: {
        include: { aprobador: { select: { id: true, nombre: true, apellido: true, rol: true } } },
        orderBy: { fecha: 'asc' }
      },
      controles: {
        include: { puente: false },
        orderBy: { fecha: 'desc' }
      },
      notificaciones: { orderBy: { creadoEn: 'desc' }, take: 10 }
    }
  });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }
  res.json(puente);
}

export async function crearPuente(req: Request, res: Response): Promise<void> {
  const {
    tipo, elementoAForzar, equipo, necesidadMotivo, descripcionDetallada,
    riesgosIdentificados, escenariosEmergencia, variablesControl, valoresMaxMin, medidasContencion
  } = req.body;

  const puente = await prisma.puente.create({
    data: {
      numeroRegistro: generarNumeroRegistro(),
      tipo, elementoAForzar, equipo, necesidadMotivo,
      descripcionDetallada: descripcionDetallada || null,
      riesgosIdentificados: riesgosIdentificados || null,
      escenariosEmergencia: escenariosEmergencia ? JSON.stringify(escenariosEmergencia) : null,
      variablesControl: variablesControl || null,
      valoresMaxMin: valoresMaxMin ? JSON.stringify(valoresMaxMin) : null,
      medidasContencion: medidasContencion || null,
      estado: 'BORRADOR',
      creadoPorId: req.user!.userId,
    }
  });

  await prisma.logAuditoria.create({
    data: { usuarioId: req.user!.userId, accion: 'CREATE', tablaAfectada: 'puentes', registroId: puente.id }
  });

  res.status(201).json(puente);
}

export async function actualizarPuente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const puente = await prisma.puente.findUnique({ where: { id } });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }
  if (puente.estado !== 'BORRADOR') {
    res.status(400).json({ error: 'Solo se pueden editar puentes en estado BORRADOR' });
    return;
  }

  const {
    tipo, elementoAForzar, equipo, necesidadMotivo, descripcionDetallada,
    riesgosIdentificados, escenariosEmergencia, variablesControl, valoresMaxMin, medidasContencion
  } = req.body;

  const updated = await prisma.puente.update({
    where: { id },
    data: {
      tipo, elementoAForzar, equipo, necesidadMotivo,
      descripcionDetallada, riesgosIdentificados,
      escenariosEmergencia: escenariosEmergencia ? JSON.stringify(escenariosEmergencia) : undefined,
      variablesControl, valoresMaxMin: valoresMaxMin ? JSON.stringify(valoresMaxMin) : undefined,
      medidasContencion
    }
  });
  res.json(updated);
}

export async function enviarParaAprobacion(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const puente = await prisma.puente.findUnique({ where: { id }, include: { creadoPor: true } });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }
  if (puente.estado !== 'BORRADOR') {
    res.status(400).json({ error: 'El puente ya fue enviado' }); return;
  }

  await prisma.puente.update({ where: { id }, data: { estado: 'PENDIENTE_NIVEL_1' } });

  // Notificar a jefes de turno
  const jefes = await prisma.usuario.findMany({ where: { rol: 'JEFE_TURNO', activo: true } });
  for (const jefe of jefes) {
    await prisma.notificacion.create({
      data: {
        usuarioId: jefe.id, puenteId: id, tipo: 'NUEVO_PUENTE',
        titulo: `Nuevo puente pendiente: ${puente.numeroRegistro}`,
        mensaje: `Se requiere aprobación Nivel 1 para el puente ${puente.elementoAForzar}`
      }
    });
    if (jefe.notificacionesEmail) {
      await sendEmail(jefe.email, `Puente ${puente.numeroRegistro} - Aprobación requerida`,
        emailNuevoPuente(jefe.email, puente.numeroRegistro, puente.elementoAForzar));
    }
  }

  await prisma.logAuditoria.create({
    data: { usuarioId: req.user!.userId, accion: 'SUBMIT', tablaAfectada: 'puentes', registroId: id }
  });

  res.json({ message: 'Puente enviado para aprobación', estado: 'PENDIENTE_NIVEL_1' });
}

export async function aprobarPuente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { comentarios } = req.body;
  const user = req.user!;

  const puente = await prisma.puente.findUnique({ where: { id }, include: { creadoPor: true } });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }

  let nivel = 0;
  let nuevoEstado = '';
  let proximaRenovacion: Date | null = null;

  if (puente.estado === 'PENDIENTE_NIVEL_1' && user.rol === 'JEFE_TURNO') {
    nivel = 1; nuevoEstado = 'APROBADO_NIVEL_1';
    proximaRenovacion = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  } else if (puente.estado === 'PENDIENTE_NIVEL_2' && user.rol === 'JEFE_AREA') {
    nivel = 2; nuevoEstado = 'APROBADO_NIVEL_2';
    proximaRenovacion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else if (puente.estado === 'PENDIENTE_NIVEL_3' && user.rol === 'GERENTE') {
    nivel = 3; nuevoEstado = 'APROBADO_NIVEL_3';
    proximaRenovacion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else {
    res.status(400).json({ error: 'No tiene permisos para aprobar en este nivel o estado incorrecto' });
    return;
  }

  await prisma.$transaction([
    prisma.aprobacion.create({
      data: { puenteId: id, aprobadorId: user.userId, nivel, estado: 'APROBADO', comentarios, firmaDigital: `${user.email}-${Date.now()}` }
    }),
    prisma.puente.update({ where: { id }, data: { estado: nuevoEstado, proximaRenovacion } })
  ]);

  // Notificar al solicitante
  await prisma.notificacion.create({
    data: {
      usuarioId: puente.creadoPorId, puenteId: id, tipo: 'APROBADO',
      titulo: `Puente aprobado - Nivel ${nivel}`,
      mensaje: `El puente ${puente.numeroRegistro} fue aprobado en el Nivel ${nivel}`
    }
  });

  if (puente.creadoPor.notificacionesEmail) {
    await sendEmail(puente.creadoPor.email, `Puente ${puente.numeroRegistro} aprobado`,
      emailAprobado(puente.numeroRegistro, nivel));
  }

  await prisma.logAuditoria.create({
    data: { usuarioId: user.userId, accion: `APPROVE_L${nivel}`, tablaAfectada: 'puentes', registroId: id }
  });

  res.json({ message: `Puente aprobado en Nivel ${nivel}`, estado: nuevoEstado });
}

export async function rechazarPuente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { comentarios } = req.body;
  if (!comentarios) { res.status(400).json({ error: 'Se requiere motivo de rechazo' }); return; }
  const user = req.user!;

  const puente = await prisma.puente.findUnique({ where: { id }, include: { creadoPor: true } });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }

  let nivel = 0;
  if (puente.estado === 'PENDIENTE_NIVEL_1') nivel = 1;
  else if (puente.estado === 'PENDIENTE_NIVEL_2') nivel = 2;
  else if (puente.estado === 'PENDIENTE_NIVEL_3') nivel = 3;
  else { res.status(400).json({ error: 'El puente no está en estado de aprobación' }); return; }

  await prisma.$transaction([
    prisma.aprobacion.create({
      data: { puenteId: id, aprobadorId: user.userId, nivel, estado: 'RECHAZADO', comentarios }
    }),
    prisma.puente.update({ where: { id }, data: { estado: 'RECHAZADO', activo: false } })
  ]);

  await prisma.notificacion.create({
    data: {
      usuarioId: puente.creadoPorId, puenteId: id, tipo: 'RECHAZADO',
      titulo: `Puente rechazado`,
      mensaje: `El puente ${puente.numeroRegistro} fue rechazado. Motivo: ${comentarios}`
    }
  });

  if (puente.creadoPor.notificacionesEmail) {
    await sendEmail(puente.creadoPor.email, `Puente ${puente.numeroRegistro} rechazado`,
      emailRechazado(puente.numeroRegistro, comentarios));
  }

  await prisma.logAuditoria.create({
    data: { usuarioId: user.userId, accion: `REJECT_L${nivel}`, tablaAfectada: 'puentes', registroId: id }
  });

  res.json({ message: 'Puente rechazado', estado: 'RECHAZADO' });
}

export async function renovarPuente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { comentarios } = req.body;
  const user = req.user!;

  const puente = await prisma.puente.findUnique({ where: { id } });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }

  const estadosActivos = ['APROBADO_NIVEL_1', 'APROBADO_NIVEL_2', 'APROBADO_NIVEL_3'];
  if (!estadosActivos.includes(puente.estado)) {
    res.status(400).json({ error: 'Solo se pueden renovar puentes activos' }); return;
  }

  let nuevoEstado = puente.estado;
  let proximaRenovacion: Date;

  if (puente.estado === 'APROBADO_NIVEL_1') {
    nuevoEstado = 'PENDIENTE_NIVEL_2';
    proximaRenovacion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else if (puente.estado === 'APROBADO_NIVEL_2') {
    nuevoEstado = 'PENDIENTE_NIVEL_3';
    proximaRenovacion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else {
    nuevoEstado = 'APROBADO_NIVEL_3';
    proximaRenovacion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  await prisma.puente.update({ where: { id }, data: { estado: nuevoEstado, proximaRenovacion } });

  await prisma.notificacion.create({
    data: {
      usuarioId: puente.creadoPorId, puenteId: id, tipo: 'RENOVACION',
      titulo: `Puente requiere renovación`,
      mensaje: `El puente ${puente.numeroRegistro} fue solicitado para renovación${comentarios ? ': ' + comentarios : ''}`
    }
  });

  res.json({ message: 'Renovación iniciada', estado: nuevoEstado });
}

export async function cerrarPuente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { observaciones } = req.body;
  const user = req.user!;

  const puente = await prisma.puente.findUnique({ where: { id } });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }

  const estadosValidos = ['APROBADO_NIVEL_1', 'APROBADO_NIVEL_2', 'APROBADO_NIVEL_3', 'PENDIENTE_NIVEL_2', 'PENDIENTE_NIVEL_3'];
  if (!estadosValidos.includes(puente.estado)) {
    res.status(400).json({ error: 'No se puede cerrar el puente en su estado actual' }); return;
  }

  await prisma.puente.update({
    where: { id },
    data: { estado: 'CERRADO', activo: false, cerradoEn: new Date(), observaciones: observaciones || null }
  });

  await prisma.notificacion.create({
    data: {
      usuarioId: puente.creadoPorId, puenteId: id, tipo: 'CERRADO',
      titulo: `Puente normalizado`,
      mensaje: `El puente ${puente.numeroRegistro} fue cerrado/normalizado`
    }
  });

  await prisma.logAuditoria.create({
    data: { usuarioId: user.userId, accion: 'CLOSE', tablaAfectada: 'puentes', registroId: id }
  });

  res.json({ message: 'Puente cerrado/normalizado', estado: 'CERRADO' });
}

export async function activarPuente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const puente = await prisma.puente.findUnique({ where: { id } });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }

  const estadosAprobados = ['APROBADO_NIVEL_1', 'APROBADO_NIVEL_2', 'APROBADO_NIVEL_3'];
  if (!estadosAprobados.includes(puente.estado)) {
    res.status(400).json({ error: 'El puente debe estar aprobado para activarse' }); return;
  }

  await prisma.puente.update({ where: { id }, data: { ejecutadoEn: new Date() } });
  res.json({ message: 'Puente marcado como ejecutado' });
}

export async function obtenerPDF(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const puente = await prisma.puente.findUnique({
    where: { id },
    include: {
      creadoPor: { select: { nombre: true, apellido: true, area: true } },
      aprobaciones: {
        include: { aprobador: { select: { nombre: true, apellido: true } } },
        orderBy: { fecha: 'asc' }
      }
    }
  });
  if (!puente) { res.status(404).json({ error: 'Puente no encontrado' }); return; }

  const pdfPath = await generarPDFPuente(puente as Parameters<typeof generarPDFPuente>[0]);
  await prisma.puente.update({ where: { id }, data: { pdfUrl: pdfPath } });
  res.json({ url: pdfPath });
}

export async function agregarControl(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { observaciones, sigueSiendoNecesario } = req.body;
  const user = req.user!;

  const control = await prisma.controlPeriodico.create({
    data: {
      puenteId: id, supervisorId: user.userId,
      observaciones: observaciones || null,
      sigueSiendoNecesario: sigueSiendoNecesario !== false
    }
  });
  res.status(201).json(control);
}

export async function pendientesAprobacion(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  let estadosPendientes: string[] = [];

  if (user.rol === 'JEFE_TURNO') estadosPendientes = ['PENDIENTE_NIVEL_1'];
  else if (user.rol === 'JEFE_AREA') estadosPendientes = ['PENDIENTE_NIVEL_2'];
  else if (user.rol === 'GERENTE') estadosPendientes = ['PENDIENTE_NIVEL_3'];
  else if (user.rol === 'ADMIN') estadosPendientes = ['PENDIENTE_NIVEL_1', 'PENDIENTE_NIVEL_2', 'PENDIENTE_NIVEL_3'];

  const puentes = await prisma.puente.findMany({
    where: { estado: { in: estadosPendientes } },
    include: {
      creadoPor: { select: { nombre: true, apellido: true, area: true } },
      aprobaciones: { include: { aprobador: { select: { nombre: true, apellido: true } } } }
    },
    orderBy: { creadoEn: 'asc' }
  });
  res.json(puentes);
}

export async function dashboardStats(req: Request, res: Response): Promise<void> {
  const [
    totalActivos, pendientesNivel1, pendientesNivel2, pendientesNivel3,
    cerradosEstaSemana, porTipo, porEstado, porExpirar
  ] = await Promise.all([
    prisma.puente.count({ where: { activo: true, estado: { notIn: ['CERRADO', 'RECHAZADO'] } } }),
    prisma.puente.count({ where: { estado: 'PENDIENTE_NIVEL_1' } }),
    prisma.puente.count({ where: { estado: 'PENDIENTE_NIVEL_2' } }),
    prisma.puente.count({ where: { estado: 'PENDIENTE_NIVEL_3' } }),
    prisma.puente.count({
      where: { estado: 'CERRADO', cerradoEn: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    }),
    prisma.puente.groupBy({ by: ['tipo'], _count: { tipo: true } }),
    prisma.puente.groupBy({ by: ['estado'], _count: { estado: true } }),
    prisma.puente.findMany({
      where: {
        activo: true,
        estado: { notIn: ['BORRADOR', 'CERRADO', 'RECHAZADO'] },
        proximaRenovacion: { lte: new Date(Date.now() + 48 * 60 * 60 * 1000) }
      },
      include: { creadoPor: { select: { nombre: true, apellido: true } } },
      take: 10
    })
  ]);

  res.json({
    totalActivos, pendientesNivel1, pendientesNivel2, pendientesNivel3,
    cerradosEstaSemana, porTipo, porEstado, porExpirar
  });
}
