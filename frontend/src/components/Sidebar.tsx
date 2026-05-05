import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Plus, CheckSquare, Activity, BarChart2, Shield, Users, FileText, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Rol } from '../types';

interface NavItem { to: string; label: string; icon: React.ReactNode; roles?: Rol[] }

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/bridges', label: 'Puentes', icon: <List size={18} /> },
  { to: '/bridges/new', label: 'Nuevo Puente', icon: <Plus size={18} />, roles: ['SOLICITANTE', 'JEFE_TURNO', 'JEFE_AREA', 'GERENTE', 'ADMIN'] },
  { to: '/approvals', label: 'Aprobaciones', icon: <CheckSquare size={18} />, roles: ['JEFE_TURNO', 'JEFE_AREA', 'GERENTE', 'ADMIN'] },
  { to: '/active', label: 'Activos', icon: <Activity size={18} /> },
  { to: '/reports', label: 'Reportes', icon: <BarChart2 size={18} />, roles: ['JEFE_AREA', 'GERENTE', 'AUDITOR', 'ADMIN'] },
  { to: '/audits', label: 'Auditorías', icon: <Shield size={18} />, roles: ['AUDITOR', 'GERENTE', 'ADMIN'] },
  { to: '/logs', label: 'Logs', icon: <FileText size={18} />, roles: ['ADMIN', 'AUDITOR'] },
  { to: '/admin/users', label: 'Usuarios', icon: <Users size={18} />, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const visible = navItems.filter(item => !item.roles || item.roles.includes(user?.rol as Rol));

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <Zap size={24} className="text-yellow-400" />
          <div>
            <h1 className="font-bold text-lg leading-none">Puentes</h1>
            <p className="text-blue-300 text-xs">MANT-309</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-white">{user?.nombre} {user?.apellido}</p>
          <p className="text-xs text-blue-300">{user?.rol?.replace('_', ' ')} · {user?.area}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
