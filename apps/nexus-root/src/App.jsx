import { Routes, Route, Navigate } from 'react-router-dom';
import { useRootAuth } from './hooks/useRootAuth.js';
import RootLoginPage  from './pages/LoginPage.jsx';
import RootDashboard  from './pages/DashboardPage.jsx';
import TenantsPage    from './pages/TenantsPage.jsx';

function Protected({ children }) {
  const { user } = useRootAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ROOT') return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RootLoginPage />} />
      <Route path="/" element={<Protected><RootDashboard /></Protected>} />
      <Route path="/tenants" element={<Protected><TenantsPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
