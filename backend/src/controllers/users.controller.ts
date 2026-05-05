import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export async function listarUsuarios(req: Request, res: Response): Promise<void> {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, email: true, nombre: true, apellido: true, rol: true, area: true, activo: true, creadoEn: true, ultimoAcceso: true },
    orderBy: { nombre: 'asc' }
  });
  res.json(usuarios);
}

export async function crearUsuario(req: Request, res: Response): Promise<void> {
  const { email, password, nombre, apellido, rol, area } = req.body;
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) { res.status(400).json({ error: 'El email ya está registrado' }); return; }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.usuario.create({ data: { email, password: hash, nombre, apellido, rol, area } });
  await prisma.logAuditoria.create({
    data: { usuarioId: req.user!.userId, accion: 'CREATE_USER', tablaAfectada: 'usuarios', registroId: user.id }
  });
  res.status(201).json({ id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, rol: user.rol, area: user.area });
}

export async function actualizarUsuario(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { nombre, apellido, rol, area, activo, notificacionesEmail } = req.body;
  const user = await prisma.usuario.update({
    where: { id },
    data: { nombre, apellido, rol, area, activo, notificacionesEmail },
    select: { id: true, email: true, nombre: true, apellido: true, rol: true, area: true, activo: true }
  });
  res.json(user);
}

export async function desactivarUsuario(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await prisma.usuario.update({ where: { id }, data: { activo: false } });
  res.json({ message: 'Usuario desactivado' });
}

export async function obtenerPerfil(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, email: true, nombre: true, apellido: true, rol: true, area: true, activo: true, creadoEn: true, ultimoAcceso: true }
  });
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
  res.json(user);
}
