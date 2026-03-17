import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import ConsentsPage from './pages/ConsentsPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage.jsx';
import ManagerUsersPage from './pages/manager/ManagerUsersPage.jsx';
import ManagerSettingsPage from './pages/manager/ManagerSettingsPage.jsx';

/**
 * Mapa de tenant_type → classe CSS de tema
 * Ao fazer login, a API retorna tenant_type no JWT.
 * O React aplica a classe no <body>, as variáveis CSS mudam automaticamente.
 */
const THEME_MAP = {
  MED: 'theme-med',       // Azul — NexusMed
  CLIN: 'theme-clin',     // Rosa — NexusClin
  ODONTO: 'theme-odonto', // Verde — NexusOdonto
  LAB: 'theme-lab',       // Roxo — NexusLab
  IMG: 'theme-img',       // Laranja — NexusIMG
  ADM: 'theme-adm',       // Teal — NexusAdm
};

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  // Injeta tema dinamicamente conforme tenant_type do usuário logado
  useEffect(() => {
    const themeClass = user ? (THEME_MAP[user.tenant_type] || 'theme-med') : '';

    // Remove todas as classes de tema anteriores
    Object.values(THEME_MAP).forEach((cls) => document.body.classList.remove(cls));

    if (themeClass) {
      document.body.classList.add(themeClass);
    }
  }, [user?.tenant_type]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PatientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consents"
        element={
          <ProtectedRoute>
            <ConsentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/manager" element={<ProtectedRoute><ManagerDashboardPage /></ProtectedRoute>} />
      <Route path="/manager/users" element={<ProtectedRoute><ManagerUsersPage /></ProtectedRoute>} />
      <Route path="/manager/settings" element={<ProtectedRoute><ManagerSettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
