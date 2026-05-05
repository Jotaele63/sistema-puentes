import { useQuery } from '@tanstack/react-query';
import { bridgesApi } from '../services/api';
import { DashboardStats, Puente } from '../types';
import { Activity, AlertTriangle, CheckCircle, Clock, Plus, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { EstadoBadge } from '../components/EstadoBadge';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ title, value, icon, color, onClick }: {
  title: string; value: number; icon: React.ReactNode; color: string; onClick?: () => void
}) {
  return (
    <div className={`card cursor-pointer hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => bridgesApi.dashboard().then(r => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  const pendientesTotal = (stats?.pendientesNivel1 || 0) + (stats?.pendientesNivel2 || 0) + (stats?.pendientesNivel3 || 0);

  const tipoData = stats?.porTipo?.map(t => ({ name: t.tipo, value: t._count.tipo })) || [];
  const estadoData = stats?.porEstado?.filter(e => e._count.estado > 0).map(e => ({
    name: e.estado.replace('_', ' ').replace('_', ' '), value: e._count.estado
  })) || [];

  const canCreate = ['SOLICITANTE', 'JEFE_TURNO', 'JEFE_AREA', 'GERENTE', 'ADMIN'].includes(user?.rol || '');

  return (
    <div className="space-y-6">
      {canCreate && (
        <div className="flex justify-end">
          <button onClick={() => navigate('/bridges/new')} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nuevo Puente
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Puentes Activos" value={stats?.totalActivos || 0} icon={<Activity size={24} className="text-blue-600" />} color="text-blue-600" onClick={() => navigate('/active')} />
        <StatCard title="Pendientes Aprobación" value={pendientesTotal} icon={<Clock size={24} className="text-yellow-600" />} color="text-yellow-600" onClick={() => navigate('/approvals')} />
        <StatCard title="Próximos a Expirar" value={stats?.porExpirar?.length || 0} icon={<AlertTriangle size={24} className="text-red-600" />} color="text-red-600" />
        <StatCard title="Cerrados Esta Semana" value={stats?.cerradosEstaSemana || 0} icon={<CheckCircle size={24} className="text-green-600" />} color="text-green-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Puentes por Tipo</h3>
          {tipoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={tipoData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {tipoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">Sin datos</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Puentes por Estado</h3>
          {estadoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={estadoData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">Sin datos</p>}
        </div>
      </div>

      {/* Por expirar */}
      {(stats?.porExpirar?.length || 0) > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" /> Próximos a Expirar (48h)
          </h3>
          <div className="space-y-2">
            {stats!.porExpirar.map((p: Puente) => {
              const horas = p.proximaRenovacion ? differenceInHours(new Date(p.proximaRenovacion), new Date()) : 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100"
                  onClick={() => navigate(`/bridges/${p.id}`)}
                >
                  <div>
                    <p className="font-medium text-sm text-gray-800">{p.numeroRegistro} — {p.elementoAForzar}</p>
                    <p className="text-xs text-gray-500">{p.equipo} · {p.creadoPor.nombre} {p.creadoPor.apellido}</p>
                  </div>
                  <div className="text-right">
                    <EstadoBadge estado={p.estado} />
                    <p className={`text-xs mt-1 font-medium ${horas < 24 ? 'text-red-600' : 'text-orange-500'}`}>
                      {horas > 0 ? `${horas}h restantes` : 'VENCIDO'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pendientes por nivel */}
      {pendientesTotal > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Distribución de Pendientes</h3>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(nivel => {
              const count = nivel === 1 ? stats?.pendientesNivel1 : nivel === 2 ? stats?.pendientesNivel2 : stats?.pendientesNivel3;
              return (
                <div key={nivel} className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{count || 0}</p>
                  <p className="text-sm text-yellow-600">Nivel {nivel}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
