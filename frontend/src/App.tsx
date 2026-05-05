import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BridgeList } from './pages/bridges/BridgeList';
import { BridgeCreate } from './pages/bridges/BridgeCreate';
import { BridgeDetail } from './pages/bridges/BridgeDetail';
import { Approvals } from './pages/bridges/Approvals';
import { ActiveBridges } from './pages/bridges/ActiveBridges';
import { Reports } from './pages/reports/Reports';
import { Audits } from './pages/Audits';
import { Logs } from './pages/Logs';
import { Users } from './pages/admin/Users';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bridges" element={<BridgeList />} />
            <Route path="bridges/new" element={<BridgeCreate />} />
            <Route path="bridges/:id" element={<BridgeDetail />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="active" element={<ActiveBridges />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audits" element={<Audits />} />
            <Route path="logs" element={<Logs />} />
            <Route path="admin/users" element={<Users />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
