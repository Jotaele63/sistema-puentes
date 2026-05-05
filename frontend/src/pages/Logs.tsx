import { useQuery } from '@tanstack/react-query';
import { logsApi } from '../services/api';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

export function Logs() {
  const { data, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => logsApi.list({ limit: 100 }).then(r => r.data),
  });

  const colorAccion = (accion: string) => {
    if (accion.includes('LOGIN')) return 'bg-blue-100 text-blue-700';
    if (accion.includes('CREATE')) return 'bg-green-100 text-green-700';
    if (accion.includes('APPROVE')) return 'bg-emerald-100 text-emerald-700';
    if (accion.includes('REJECT')) return 'bg-red-100 text-red-700';
    if (accion.includes('CLOSE')) return 'bg-gray-100 text-gray-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{data?.total || 0} registros de auditoría</p>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600">Acción</th>
              <th className="text-left px-4 py-3 text-gray-600">Usuario</th>
              <th className="text-left px-4 py-3 text-gray-600">Tabla</th>
              <th className="text-left px-4 py-3 text-gray-600">Registro ID</th>
              <th className="text-left px-4 py-3 text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando...</td></tr>}
            {!isLoading && (!data?.data || data.data.length === 0) && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">
                <FileText size={32} className="mx-auto mb-2 text-gray-300" /><p>Sin registros</p>
              </td></tr>
            )}
            {data?.data?.map((log: { id: string; accion: string; usuario?: { nombre: string; apellido: string; email: string }; tablaAfectada?: string; registroId?: string; timestamp: string }) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorAccion(log.accion)}`}>{log.accion}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{log.usuario ? `${log.usuario.nombre} ${log.usuario.apellido}` : '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{log.tablaAfectada || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.registroId?.slice(0, 8) || '—'}...</td>
                <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(log.timestamp), 'dd/MM/yy HH:mm:ss')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
