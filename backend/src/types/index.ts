export type Rol = 'SOLICITANTE' | 'JEFE_TURNO' | 'JEFE_AREA' | 'GERENTE' | 'AUDITOR' | 'ADMIN';
export type Area = 'OPERACIONES' | 'MANTENIMIENTO' | 'PROCESOS' | 'SEGURIDAD' | 'ADMIN';
export type TipoPuente = 'OPERATIVO' | 'MANTENIMIENTO';
export type EstadoPuente =
  | 'BORRADOR'
  | 'PENDIENTE_NIVEL_1'
  | 'APROBADO_NIVEL_1'
  | 'PENDIENTE_NIVEL_2'
  | 'APROBADO_NIVEL_2'
  | 'PENDIENTE_NIVEL_3'
  | 'APROBADO_NIVEL_3'
  | 'EVALUACION_MODIFICACION'
  | 'CERRADO'
  | 'RECHAZADO';

export interface JwtPayload {
  userId: string;
  email: string;
  rol: Rol;
  area: Area;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
