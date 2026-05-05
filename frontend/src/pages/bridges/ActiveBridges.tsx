import { useQuery } from '@tanstack/react-query';
import { bridgesApi } from '../../services/api';
import { Puente } from '../../types';
import { EstadoBadge } from '../../components/EstadoBadge';
import { useNavigate } from 'react-router-dom';
import { differenceInHours, differenceInDays, format } from 'date-fns';
import { Activity, AlertTriangle, Clock } from 'lucide-react';

function Countdown({ date }: { date: string }) {
  const target = new Date(date);
  const now = new Date();
  const horas = differenceInHours(target, now);
  const dias = differenceInDays(target, now);

  if (horas < 0) return <span className="text-red-600 font-bold text-sm flex items-center gap-1"><AlertTriangle size={14} /> VENCIDO</span>;
  if (horas < 24) return <span className="text-red-600 font-medium text-sm flex items-center gap-1"><AlertTriangle size={14} /> {horas}h restantes</span>;
  return <span className="text-orange-500 text-sm flex items-center gap-1"><Clock size={14} /> {dias}d restantes</span>;
}

export function ActiveBridges() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['active-bridges'],
    queryFn: () => bridgesApi.list({ estado: undefined, page: 1, limit: 100 }).then(r =>
      r.data.data.filter((p: Puente) => p.activo && !['CERRADO', 'RECHAZADO', 'BORRADOR'].includes(p.estado))
    ),
    refetchInterval: 60000,
  });

  const porExpirar = data?.filter((p: Puente) => p.proximaRenovacion && differenceInHours(new Date(p.proximaRenovacion), new Date()) < 48) || [];
  const resto = data?.filter((p: Puente) => !p.proximaRenovacion || differenceInHours(new Date(p.proximaRenovacion), new Date()) >= 48) || [];

  return (
    <div className="space-y-6">
      {porExpirar.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-3">
            <AlertTriangle size={16} /> Próximos a Expirar ({porExpirar.length})
          </h3>
          <div className="space-y-3">
            {porExpirar.map((p: Puente) => <BridgeCard key={p.id} puente={p} onClick={() => navigate(`/bridges/${p.id}`)} urgent />)}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2 mb-3">
          <Activity size={16} /> Puentes Activos ({resto.length})
        </h3>
        {isLoading && <div className="text-center py-8 text-gray-400">Cargando...</div>}
        {!isLoading && resto.length === 0 && porExpirar.length === 0 && (
          <div className="card text-center py-12">
            <Activity size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay puentes activos</p>
          </div>
        )}
        <div className="space-y-3">
          {resto.map((p: Puente) => <BridgeCard key={p.id} puente={p} onClick={() => navigate(`/bridges/${p.id}`)} />)}
        </div>
      </div>
    </div>
  );
}

function BridgeCard({ puente: p, onClick, urgent }: { puente: Puente; onClick: () => void; urgent?: boolean }) {
  return (
    <div
      className={`card cursor-pointer hover:shadow-md transition-shadow ${urgent ? 'border-red-200 bg-red-50/30' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-700">{p.numeroRegistro}</span>
            <EstadoBadge estado={p.estado} />
            {p.ejecutadoEn && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Activity size={10} /> Ejecutado</span>}
          </div>
          <h3 className="font-semibold text-gray-800">{p.elementoAForzar}</h3>
          <p className="text-sm text-gray-500">{p.equipo} · {p.creadoPor.nombre} {p.creadoPor.apellido} ({p.creadoPor.area})</p>
        </div>
        <div className="text-right ml-4">
          {p.proximaRenovacion && <Countdown date={p.proximaRenovacion} />}
          {p.ejecutadoEn && <p className="text-xs text-gray-400 mt-1">Desde {format(new Date(p.ejecutadoEn), 'dd/MM/yy')}</p>}
        </div>
      </div>
    </div>
  );
}
