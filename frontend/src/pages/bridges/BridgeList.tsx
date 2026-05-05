import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bridgesApi } from '../../services/api';
import { Puente } from '../../types';
import { EstadoBadge } from '../../components/EstadoBadge';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

export function BridgeList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['bridges', { buscar, estado, tipo, page }],
    queryFn: () => bridgesApi.list({ buscar: buscar || undefined, estado: estado || undefined, tipo: tipo || undefined, page }).then(r => r.data),
  });

  const canCreate = ['SOLICITANTE', 'JEFE_TURNO', 'JEFE_AREA', 'GERENTE', 'ADMIN'].includes(user?.rol || '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={buscar}
              onChange={e => { setBuscar(e.target.value); setPage(1); }}
              placeholder="Buscar por registro, elemento, equipo..."
              className="input-field pl-9"
            />
          </div>
          <select value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }} className="input-field w-auto">
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="PENDIENTE_NIVEL_1">Pendiente N1</option>
            <option value="APROBADO_NIVEL_1">Aprobado N1</option>
            <option value="PENDIENTE_NIVEL_2">Pendiente N2</option>
            <option value="APROBADO_NIVEL_2">Aprobado N2</option>
            <option value="PENDIENTE_NIVEL_3">Pendiente N3</option>
            <option value="APROBADO_NIVEL_3">Aprobado N3</option>
            <option value="CERRADO">Cerrado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
          <select value={tipo} onChange={e => { setTipo(e.target.value); setPage(1); }} className="input-field w-auto">
            <option value="">Todos los tipos</option>
            <option value="OPERATIVO">Operativo</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
          </select>
        </div>
        {canCreate && (
          <button onClick={() => navigate('/bridges/new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Registro</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Elemento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Equipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Creado por</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Expira</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              )}
              {!isLoading && (!data?.data || data.data.length === 0) && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No se encontraron puentes</td></tr>
              )}
              {data?.data?.map((p: Puente) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{p.numeroRegistro}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{p.elementoAForzar}</td>
                  <td className="px-4 py-3 text-gray-600">{p.equipo}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.tipo === 'OPERATIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3"><EstadoBadge estado={p.estado} /></td>
                  <td className="px-4 py-3 text-gray-600">{p.creadoPor.nombre} {p.creadoPor.apellido}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(p.creadoEn), 'dd/MM/yy HH:mm')}</td>
                  <td className="px-4 py-3 text-xs">
                    {p.proximaRenovacion ? (
                      <span className={new Date(p.proximaRenovacion) < new Date() ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {format(new Date(p.proximaRenovacion), 'dd/MM/yy')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/bridges/${p.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Total: {data.total} puentes</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Anterior</button>
              <span className="text-sm text-gray-600">{page} / {data.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
