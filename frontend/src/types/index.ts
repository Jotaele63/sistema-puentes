export type Rol = 'SOLICITANTE' | 'JEFE_TURNO' | 'JEFE_AREA' | 'GERENTE' | 'AUDITOR' | 'ADMIN';
export type Area = 'OPERACIONES' | 'MANTENIMIENTO' | 'PROCESOS' | 'SEGURIDAD' | 'ADMIN';
export type TipoPuente = 'OPERATIVO' | 'MANTENIMIENTO';
export type EstadoPuente =
  | 'BORRADOR' | 'PENDIENTE_NIVEL_1' | 'APROBADO_NIVEL_1'
  | 'PENDIENTE_NIVEL_2' | 'APROBADO_NIVEL_2'
  | 'PENDIENTE_NIVEL_3' | 'APROBADO_NIVEL_3'
  | 'EVALUACION_MODIFICACION' | 'CERRADO' | 'RECHAZADO';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  area: Area;
  activo?: boolean;
  creadoEn?: string;
  ultimoAcceso?: string;
}

export interface Aprobacion {
  id: string;
  nivel: number;
  estado: string;
  fecha: string;
  comentarios?: string;
  aprobador: { nombre: string; apellido: string; rol?: string };
}

export interface Puente {
  id: string;
  numeroRegistro: string;
  tipo: TipoPuente;
  elementoAForzar: string;
  equipo: string;
  necesidadMotivo: string;
  descripcionDetallada?: string;
  estado: EstadoPuente;
  riesgosIdentificados?: string;
  escenariosEmergencia?: string;
  variablesControl?: string;
  medidasContencion?: string;
  creadoEn: string;
  modificadoEn: string;
  ejecutadoEn?: string;
  cerradoEn?: string;
  proximaRenovacion?: string;
  activo: boolean;
  observaciones?: string;
  pdfUrl?: string;
  creadoPor: { nombre: string; apellido: string; area: string; email?: string };
  aprobaciones: Aprobacion[];
}

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: string;
  puenteId?: string;
}

export interface DashboardStats {
  totalActivos: number;
  pendientesNivel1: number;
  pendientesNivel2: number;
  pendientesNivel3: number;
  cerradosEstaSemana: number;
  porTipo: Array<{ tipo: string; _count: { tipo: number } }>;
  porEstado: Array<{ estado: string; _count: { estado: number } }>;
  porExpirar: Puente[];
}
