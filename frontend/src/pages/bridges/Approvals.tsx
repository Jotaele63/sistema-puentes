import { useQuery } from '@tanstack/react-query';
import { bridgesApi } from '../../services/api';
import { Puente } from '../../types';
import { EstadoBadge } from '../../components/EstadoBadge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckSquare, Clock } from 'lucide-react';

export function Approvals() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => bridgesApi.pendientes().then(r => r.data as Puente[]),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-600">
        <CheckSquare size={20} />
        <p className="text-sm">{data?.length || 0} puentes pendientes de tu aprobación</p>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-400">Cargando...</div>}

      {!isLoading && (!data || data.length === 0) && (
        <div className="card text-center py-12">
          <CheckSquare size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-500 font-medium">No hay aprobaciones pendientes</p>
          <p className="text-gray-400 text-sm mt-1">Estás al día con todas las solicitudes</p>
        </div>
      )}

      {data?.map((p: Puente) => (
        <div key={p.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/bridges/${p.id}`)}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm font-bold text-blue-700">{p.numeroRegistro}</span>
                <EstadoBadge estado={p.estado} />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.tipo === 'OPERATIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{p.tipo}</span>
              </div>
              <h3 className="font-semibold text-gray-800">{p.elementoAForzar}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{p.equipo}</p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.necesidadMotivo}</p>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                <Clock size={12} /> {format(new Date(p.creadoEn), 'dd/MM/yyyy')}
              </p>
              <p className="text-sm text-gray-600 mt-1">{p.creadoPor.nombre} {p.creadoPor.apellido}</p>
              <p className="text-xs text-gray-400">{p.creadoPor.area}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Haga clic para ver detalles y aprobar / rechazar</p>
            <span className="text-xs text-blue-600 font-medium">Ver detalles →</span>
          </div>
        </div>
      ))}
    </div>
  );
}
