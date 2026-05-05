import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';
import { EstadoBadge } from '../../components/EstadoBadge';
import { Puente } from '../../types';

export function Reports() {
  const [tab, setTab] = useState<'monthly' | 'quarterly' | 'trends'>('monthly');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const monthlyQ = useQuery({
    queryKey: ['report-monthly', mes, anio],
    queryFn: () => reportsApi.monthly(mes, anio).then(r => r.data),
    enabled: tab === 'monthly',
  });

  const quarterlyQ = useQuery({
    queryKey: ['report-quarterly'],
    queryFn: () => reportsApi.quarterly().then(r => r.data),
    enabled: tab === 'quarterly',
  });

  const trendsQ = useQuery({
    queryKey: ['report-trends'],
    queryFn: () => reportsApi.trends().then(r => r.data),
    enabled: tab === 'trends',
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['monthly', 'quarterly', 'trends'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'monthly' ? 'Mensual' : t === 'quarterly' ? 'Trimestral' : 'Tendencias'}
          </button>
        ))}
      </div>

      {tab === 'monthly' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <select value={mes} onChange={e => setMes(Number(e.target.value))} className="input-field w-auto">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{new Date(2000, m-1).toLocaleDateString('es-AR', { month: 'long' })}</option>
              ))}
            </select>
            <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="input-field w-auto">
              {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {monthlyQ.data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Creados" value={monthlyQ.data.creados} color="blue" />
                <Stat label="Cerrados" value={monthlyQ.data.cerrados} color="green" />
                <Stat label="Rechazados" value={monthlyQ.data.rechazados} color="red" />
                <Stat label="Tiempo Prom." value={`${monthlyQ.data.tiempoPromedioDias?.toFixed(1)}d`} color="yellow" />
              </div>
              <PuentesTable puentes={monthlyQ.data.puentes} />
            </>
          )}
        </div>
      )}

      {tab === 'quarterly' && quarterlyQ.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total" value={quarterlyQ.data.total} color="blue" />
            <Stat label="Cerrados" value={quarterlyQ.data.cerrados} color="green" />
            <Stat label="Activos" value={quarterlyQ.data.activos} color="yellow" />
            <Stat label="Cumplimiento" value={`${quarterlyQ.data.cumplimiento}%`} color={quarterlyQ.data.estadoCumplimiento === 'CUMPLE' ? 'green' : 'red'} />
          </div>
          <div className={`card flex items-center gap-3 ${quarterlyQ.data.estadoCumplimiento === 'CUMPLE' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <span className="text-2xl">{quarterlyQ.data.estadoCumplimiento === 'CUMPLE' ? '✅' : '⚠️'}</span>
            <div>
              <p className="font-semibold text-gray-800">Estado de Cumplimiento MANT-309: {quarterlyQ.data.estadoCumplimiento}</p>
              <p className="text-sm text-gray-500">{quarterlyQ.data.cerrados} de {quarterlyQ.data.total} puentes cerrados en el trimestre</p>
            </div>
          </div>
          <PuentesTable puentes={quarterlyQ.data.puentes} />
        </div>
      )}

      {tab === 'trends' && trendsQ.data && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Tendencia últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsQ.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="creados" stroke="#3b82f6" strokeWidth={2} name="Creados" />
              <Line type="monotone" dataKey="cerrados" stroke="#10b981" strokeWidth={2} name="Cerrados" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  const c = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', yellow: 'bg-yellow-50 text-yellow-700' };
  return (
    <div className={`rounded-xl p-4 ${c[color as keyof typeof c]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  );
}

function PuentesTable({ puentes }: { puentes: Puente[] }) {
  if (!puentes?.length) return null;
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-800">Detalle de Puentes ({puentes.length})</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-2 text-gray-600">Registro</th>
            <th className="text-left px-4 py-2 text-gray-600">Elemento</th>
            <th className="text-left px-4 py-2 text-gray-600">Estado</th>
            <th className="text-left px-4 py-2 text-gray-600">Área</th>
            <th className="text-left px-4 py-2 text-gray-600">Fecha</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {puentes.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs text-blue-700">{p.numeroRegistro}</td>
                <td className="px-4 py-2">{p.elementoAForzar}</td>
                <td className="px-4 py-2"><EstadoBadge estado={p.estado} /></td>
                <td className="px-4 py-2 text-gray-500">{p.creadoPor?.area}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{format(new Date(p.creadoEn), 'dd/MM/yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
