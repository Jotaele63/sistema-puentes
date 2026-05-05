import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths } from 'date-fns';

export async function reporteMensual(req: Request, res: Response): Promise<void> {
  const { mes, anio } = req.query;
  const fecha = new Date(Number(anio) || new Date().getFullYear(), Number(mes) - 1 || new Date().getMonth(), 1);
  const inicio = startOfMonth(fecha);
  const fin = endOfMonth(fecha);

  const [creados, cerrados, rechazados, porArea, promedioTiempo] = await Promise.all([
    prisma.puente.count({ where: { creadoEn: { gte: inicio, lte: fin } } }),
    prisma.puente.count({ where: { cerradoEn: { gte: inicio, lte: fin } } }),
    prisma.puente.count({ where: { estado: 'RECHAZADO', modificadoEn: { gte: inicio, lte: fin } } }),
    prisma.puente.groupBy({
      by: ['tipo'], _count: { tipo: true },
      where: { creadoEn: { gte: inicio, lte: fin } }
    }),
    prisma.puente.findMany({
      where: { estado: 'CERRADO', cerradoEn: { gte: inicio, lte: fin }, creadoEn: { gte: inicio } },
      select: { creadoEn: true, cerradoEn: true }
    })
  ]);

  const tiempoPromedio = promedioTiempo.length > 0
    ? promedioTiempo.reduce((acc, p) => {
        const diff = (p.cerradoEn!.getTime() - p.creadoEn.getTime()) / (1000 * 60 * 60 * 24);
        return acc + diff;
      }, 0) / promedioTiempo.length
    : 0;

  const puentesActivos = await prisma.puente.findMany({
    where: { creadoEn: { gte: inicio, lte: fin } },
    include: {
      creadoPor: { select: { nombre: true, apellido: true, area: true } },
      aprobaciones: { include: { aprobador: { select: { nombre: true, apellido: true } } } }
    },
    orderBy: { creadoEn: 'desc' }
  });

  res.json({ periodo: { inicio, fin }, creados, cerrados, rechazados, porArea, tiempoPromedioDias: tiempoPromedio, puentes: puentesActivos });
}

export async function reporteTrimestral(req: Request, res: Response): Promise<void> {
  const ahora = new Date();
  const inicio = startOfQuarter(ahora);
  const fin = endOfQuarter(ahora);

  const [total, cerrados, rechazados, activos, porEstado] = await Promise.all([
    prisma.puente.count({ where: { creadoEn: { gte: inicio } } }),
    prisma.puente.count({ where: { estado: 'CERRADO', cerradoEn: { gte: inicio } } }),
    prisma.puente.count({ where: { estado: 'RECHAZADO', modificadoEn: { gte: inicio } } }),
    prisma.puente.count({ where: { activo: true, estado: { notIn: ['CERRADO', 'RECHAZADO'] } } }),
    prisma.puente.groupBy({ by: ['estado'], _count: { estado: true } })
  ]);

  const cumplimiento = total > 0 ? ((cerrados / total) * 100).toFixed(1) : 0;
  const estadoCumplimiento = Number(cumplimiento) >= 80 ? 'CUMPLE' : Number(cumplimiento) >= 50 ? 'PARCIAL' : 'NO_CUMPLE';

  const puentes = await prisma.puente.findMany({
    where: { creadoEn: { gte: inicio } },
    include: {
      creadoPor: { select: { nombre: true, apellido: true, area: true } },
      aprobaciones: { include: { aprobador: { select: { nombre: true, apellido: true } } } }
    },
    orderBy: { creadoEn: 'desc' }
  });

  res.json({ periodo: { inicio, fin }, total, cerrados, rechazados, activos, porEstado, cumplimiento, estadoCumplimiento, puentes });
}

export async function reportePersonalizado(req: Request, res: Response): Promise<void> {
  const { desde, hasta, estado, tipo, area } = req.query;

  const where: Record<string, unknown> = {};
  if (desde || hasta) {
    where.creadoEn = {
      ...(desde ? { gte: new Date(desde as string) } : {}),
      ...(hasta ? { lte: new Date(hasta as string) } : {})
    };
  }
  if (estado) where.estado = estado;
  if (tipo) where.tipo = tipo;

  const puentes = await prisma.puente.findMany({
    where,
    include: {
      creadoPor: { select: { nombre: true, apellido: true, area: true } },
      aprobaciones: { include: { aprobador: { select: { nombre: true, apellido: true } } } }
    },
    orderBy: { creadoEn: 'desc' }
  });
  res.json({ total: puentes.length, puentes });
}

export async function tendencias(req: Request, res: Response): Promise<void> {
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const fecha = subMonths(new Date(), i);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);
    const [creados, cerrados] = await Promise.all([
      prisma.puente.count({ where: { creadoEn: { gte: inicio, lte: fin } } }),
      prisma.puente.count({ where: { cerradoEn: { gte: inicio, lte: fin } } })
    ]);
    meses.push({ mes: fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }), creados, cerrados });
  }
  res.json(meses);
}

export async function listarAuditorias(req: Request, res: Response): Promise<void> {
  const auditorias = await prisma.auditoria.findMany({
    include: { realizadoPor: { select: { nombre: true, apellido: true } } },
    orderBy: { fechaRealizacion: 'desc' }
  });
  res.json(auditorias);
}

export async function crearAuditoria(req: Request, res: Response): Promise<void> {
  const { observaciones } = req.body;
  const user = req.user!;

  const puentesActivos = await prisma.puente.findMany({
    where: { activo: true },
    select: { id: true }
  });

  const auditoria = await prisma.auditoria.create({
    data: {
      tipoAuditoria: 'MANUAL',
      realizadoPorId: user.userId,
      puentesRevisados: JSON.stringify(puentesActivos.map(p => p.id)),
      puentesEncontrados: puentesActivos.length,
      estadoCumplimiento: 'CUMPLE',
      observaciones: observaciones || null
    }
  });
  res.status(201).json(auditoria);
}

export async function listarLogs(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '50', usuarioId, accion } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = {};
  if (usuarioId) where.usuarioId = usuarioId;
  if (accion) where.accion = { contains: accion as string };

  const [logs, total] = await Promise.all([
    prisma.logAuditoria.findMany({
      where, skip, take: Number(limit),
      include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.logAuditoria.count({ where })
  ]);
  res.json({ data: logs, total, page: Number(page) });
}

export async function listarNotificaciones(req: Request, res: Response): Promise<void> {
  const notifs = await prisma.notificacion.findMany({
    where: { usuarioId: req.user!.userId },
    orderBy: { creadoEn: 'desc' },
    take: 50
  });
  res.json(notifs);
}

export async function marcarNotificacionLeida(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await prisma.notificacion.update({ where: { id }, data: { leida: true } });
  res.json({ ok: true });
}

export async function marcarTodasLeidas(req: Request, res: Response): Promise<void> {
  await prisma.notificacion.updateMany({
    where: { usuarioId: req.user!.userId, leida: false },
    data: { leida: true }
  });
  res.json({ ok: true });
}
