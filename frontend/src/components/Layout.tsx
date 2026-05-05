import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/bridges': 'Listado de Puentes',
  '/bridges/new': 'Nuevo Puente',
  '/approvals': 'Aprobaciones Pendientes',
  '/active': 'Puentes Activos',
  '/reports': 'Reportes',
  '/audits': 'Auditorías',
  '/logs': 'Logs de Auditoría',
  '/admin/users': 'Gestión de Usuarios',
};

export function Layout() {
  const location = useLocation();
  const title = Object.entries(titles).find(([path]) => location.pathname.startsWith(path) && path !== '/bridges' || location.pathname === path)?.[1]
    || titles[location.pathname] || 'Puentes';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
