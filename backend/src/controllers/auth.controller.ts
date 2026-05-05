import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' });
    return;
  }
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user || !user.activo) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }
  await prisma.usuario.update({ where: { id: user.id }, data: { ultimoAcceso: new Date() } });
  await prisma.logAuditoria.create({
    data: { usuarioId: user.id, accion: 'LOGIN', tablaAfectada: 'usuarios', registroId: user.id }
  });
  const token = jwt.sign(
    { userId: user.id, email: user.email, rol: user.rol, area: user.area },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as unknown as number }
  );
  res.json({
    token,
    user: { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, rol: user.rol, area: user.area }
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.usuario.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, nombre: true, apellido: true, rol: true, area: true, notificacionesEmail: true }
  });
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
  res.json(user);
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { passwordActual, passwordNueva } = req.body;
  const user = await prisma.usuario.findUnique({ where: { id: req.user!.userId } });
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
  const ok = await bcrypt.compare(passwordActual, user.password);
  if (!ok) { res.status(400).json({ error: 'Contraseña actual incorrecta' }); return; }
  const hash = await bcrypt.hash(passwordNueva, 10);
  await prisma.usuario.update({ where: { id: user.id }, data: { password: hash } });
  res.json({ message: 'Contraseña actualizada' });
}
