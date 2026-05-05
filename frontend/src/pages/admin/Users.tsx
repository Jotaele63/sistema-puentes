import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../services/api';
import { Usuario } from '../../types';
import toast from 'react-hot-toast';
import { Plus, UserCheck, UserX, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const ROLES = ['SOLICITANTE', 'JEFE_TURNO', 'JEFE_AREA', 'GERENTE', 'AUDITOR', 'ADMIN'];
const AREAS = ['OPERACIONES', 'MANTENIMIENTO', 'PROCESOS', 'SEGURIDAD', 'ADMIN'];

export function Users() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ email: '', password: '', nombre: '', apellido: '', rol: 'SOLICITANTE', area: 'OPERACIONES' });

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data as Usuario[]),
  });

  const createMut = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal(null); toast.success('Usuario creado'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error'),
  });

  const updateMut = useMutation({
    mutationFn: () => usersApi.update(editUser!.id, { nombre: form.nombre, apellido: form.apellido, rol: form.rol, area: form.area }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal(null); toast.success('Usuario actualizado'); },
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario desactivado'); },
  });

  const openEdit = (u: Usuario) => {
    setEditUser(u);
    setForm({ email: u.email, password: '', nombre: u.nombre, apellido: u.apellido, rol: u.rol, area: u.area });
    setModal('edit');
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ email: '', password: '', nombre: '', apellido: '', rol: 'SOLICITANTE', area: 'OPERACIONES' });
    setModal('create');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.length || 0} usuarios registrados</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nuevo Usuario</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 text-gray-600">Email</th>
              <th className="text-left px-4 py-3 text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 text-gray-600">Área</th>
              <th className="text-left px-4 py-3 text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 text-gray-600">Último acceso</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Cargando...</td></tr>}
            {data?.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{u.nombre} {u.apellido}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{u.rol}</span></td>
                <td className="px-4 py-3 text-gray-500">{u.area}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {u.ultimoAcceso ? format(new Date(u.ultimoAcceso), 'dd/MM/yy HH:mm') : 'Nunca'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                    {u.activo && <button onClick={() => deactivateMut.mutate(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><UserX size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-lg">{modal === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Apellido</label>
                <input value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} className="input-field" /></div>
            </div>
            {modal === 'create' && (
              <>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" /></div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))} className="input-field">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Área</label>
                <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className="input-field">
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select></div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
              <button onClick={() => modal === 'create' ? createMut.mutate() : updateMut.mutate()} disabled={createMut.isPending || updateMut.isPending} className="btn-primary">
                {modal === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
