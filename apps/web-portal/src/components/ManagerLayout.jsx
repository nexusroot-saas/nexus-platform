import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Icon = {
  Dashboard:  () => (<svg className="nav-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>),
  Users:      () => (<svg className="nav-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7"/></svg>),
  Patients:   () => (<svg className="nav-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7"/></svg>),
  Calendar:   () => (<svg className="nav-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="16" height="14" rx="2"/><path d="M6 2v4M14 2v4M2 9h16"/></svg>),
  Shield:     () => (<svg className="nav-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2L4 5v5c0 3.5 2.5 6.74 6 7.5C14.5 16.74 17 13.5 17 10V5l-7-3z"/></svg>),
  FileText:   () => (<svg className="nav-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2h8l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M12 2v4h4M7 9h6M7 12h6M7 15h4"/></svg>),
  Settings:   () => (<svg className="nav-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"/></svg>),
  Logout:     () => (<svg className="nav-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 15l3-3-3-3M16 12H7M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3"/></svg>),
};

const LABELS = {
  MED:    { patients: 'Pacientes',     brand: 'NexusMed' },
  CLIN:   { patients: 'Clientes',      brand: 'NexusClin' },
  ODONTO: { patients: 'Pacientes',     brand: 'NexusOdonto' },
  LAB:    { patients: 'Requisitantes', brand: 'NexusLab' },
  IMG:    { patients: 'Pacientes',     brand: 'NexusIMG' },
  ADM:    { patients: 'Clientes',      brand: 'NexusAdm' },
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function ManagerLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const labels = LABELS[user?.tenant_type] || LABELS.MED;
  const hasLegal = user?.modules?.includes('NEXUSLEGAL');
  const isAdmin = user?.role === 'TENANT_ADMIN';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">N</div>
            <div>
              <div className="sidebar-logo-name">{labels.brand}</div>
              <div className="sidebar-logo-sub">NexusManager</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Visão geral</div>
          <NavLink to="/manager" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon.Dashboard /> Dashboard
          </NavLink>

          <div className="sidebar-section-label">Clínica</div>
          <NavLink to="/patients" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon.Patients /> {labels.patients}
          </NavLink>
          <NavLink to="/appointments" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon.Calendar /> Agenda
          </NavLink>

          {isAdmin && (
            <>
              <div className="sidebar-section-label">Gestão</div>
              <NavLink to="/manager/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon.Users /> Equipe
              </NavLink>
            </>
          )}

          {hasLegal && (
            <>
              <div className="sidebar-section-label">Compliance</div>
              <NavLink to="/consents" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon.Shield /> Consentimentos
              </NavLink>
              <NavLink to="/audit-logs" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon.FileText /> Auditoria
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="sidebar-section-label">Configurações</div>
              <NavLink to="/manager/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon.Settings /> Configurações
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(user?.name || 'U')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.name || 'Usuário'}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ marginTop: 4 }}>
            <Icon.Logout /> Sair
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
        </header>
        <main className="page-content animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
