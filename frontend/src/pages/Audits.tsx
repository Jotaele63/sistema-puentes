import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditsApi } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Shield, Plus } from 'lucide-react';

export function Audits() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: () => auditsApi.list().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: () => auditsApi.create(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audits'] }); toast.success('Auditoría creada'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.length || 0} auditorías realizadas</p>
        <button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva Auditoría Manual
        </button>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-400">Cargando...</div>}

      {!isLoading && (!data || data.length === 0) && (
        <div className="card text-center py-12">
          <Shield size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay auditorías registradas</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.map((a: { id: string; tipoAuditoria: string; estadoCumplimiento: string; puentesEncontrados: number; fechaRealizacion: string; realizadoPor: { nombre: string; apellido: string }; observaciones?: string }) => (
          <div key={a.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.estadoCumplimiento === 'CUMPLE' ? 'bg-green-100' : a.estadoCumplimiento === 'PARCIAL' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <Shield size={20} className={a.estadoCumplimiento === 'CUMPLE' ? 'text-green-600' : a.estadoCumplimiento === 'PARCIAL' ? 'text-yellow-600' : 'text-red-600'} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{a.tipoAuditoria}</p>
                  <p className="text-sm text-gray-500">{a.puentesEncontrados} puentes revisados</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.estadoCumplimiento === 'CUMPLE' ? 'bg-green-100 text-green-700' : a.estadoCumplimiento === 'PARCIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {a.estadoCumplimiento}
                </span>
                <p className="text-xs text-gray-400 mt-1">{format(new Date(a.fechaRealizacion), 'dd/MM/yyyy HH:mm')}</p>
                <p className="text-xs text-gray-500">{a.realizadoPor.nombre} {a.realizadoPor.apellido}</p>
              </div>
            </div>
            {a.observaciones && <p className="text-sm text-gray-600 mt-3 pt-3 border-t">{a.observaciones}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
