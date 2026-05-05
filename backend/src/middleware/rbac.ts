import { Request, Response, NextFunction } from 'express';
import { Rol } from '../types';

export function requireRol(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.rol as Rol)) {
      res.status(403).json({ error: 'Sin permisos para esta acción' });
      return;
    }
    next();
  };
}
