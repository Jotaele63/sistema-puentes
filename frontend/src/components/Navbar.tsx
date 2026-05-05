import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifsApi } from '../services/api';
import { Notificacion } from '../types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function Navbar({ title }: { title?: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notifsApi.list().then(r => r.data as Notificacion[]),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notifsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => notifsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const noLeidas = data?.filter(n => !n.leida).length || 0;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Bell size={20} />
          {noLeidas > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Notificaciones</h3>
              {noLeidas > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {(!data || data.length === 0) && (
                <p className="p-4 text-center text-gray-500 text-sm">Sin notificaciones</p>
              )}
              {data?.map(n => (
                <div
                  key={n.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${!n.leida ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    markRead.mutate(n.id);
                    if (n.puenteId) { navigate(`/bridges/${n.puenteId}`); setOpen(false); }
                  }}
                >
                  <p className={`text-sm font-medium ${!n.leida ? 'text-blue-900' : 'text-gray-800'}`}>{n.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.mensaje}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.creadoEn), { addSuffix: true, locale: es })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
