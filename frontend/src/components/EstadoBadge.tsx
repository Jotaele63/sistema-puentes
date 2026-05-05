import { EstadoPuente } from '../types';

const config: Record<string, { label: string; className: string }> = {
  BORRADOR: { label: 'Borrador', className: 'badge-borrador' },
  PENDIENTE_NIVEL_1: { label: 'Pendiente N1', className: 'badge-pendiente' },
  APROBADO_NIVEL_1: { label: 'Aprobado N1', className: 'badge-aprobado' },
  PENDIENTE_NIVEL_2: { label: 'Pendiente N2', className: 'badge-pendiente' },
  APROBADO_NIVEL_2: { label: 'Aprobado N2', className: 'badge-aprobado' },
  PENDIENTE_NIVEL_3: { label: 'Pendiente N3', className: 'badge-pendiente' },
  APROBADO_NIVEL_3: { label: 'Aprobado N3', className: 'badge-aprobado' },
  EVALUACION_MODIFICACION: { label: 'Eval. Modificación', className: 'badge-evaluacion' },
  CERRADO: { label: 'Cerrado', className: 'badge-cerrado' },
  RECHAZADO: { label: 'Rechazado', className: 'badge-rechazado' },
};

export function EstadoBadge({ estado }: { estado: EstadoPuente | string }) {
  const c = config[estado] || { label: estado, className: 'badge-borrador' };
  return <span className={c.className}>{c.label}</span>;
}
