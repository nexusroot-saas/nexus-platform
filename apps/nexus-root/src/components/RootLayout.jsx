import { NavLink, useNavigate } from 'react-router-dom';
import { useRootAuth } from '../hooks/useRootAuth.js';

const Icon = {
  Dashboard: () => (
    <svg className="root-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  ),
  Tenants: () => (
    <svg className="root-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 13V6l6-4 6 4v7H2z"/><rect x="5" y="8" width="2" height="5"/>
      <rect x="9" y="8" width="2" height="5"/>
    </svg>
  ),
  Users: () => (
    <svg className="root-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.76 2.24-5 5-5h0c2.76 0 5 2.24 5 5"/>
      <path d="M12 7c1.1 0 2 .9 2 2v1M14 7a2 2 0 010 4"/>
    </svg>
  ),
  Logout: () => (
    <svg className="root-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 12l3-3-3-3M13 9H6M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/>
    </svg>
  ),
};

export default function RootLayout({ title, children }) {
  const { user, logout } = useRootAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="root-layout">
      <aside className="root-sidebar">
        <div className="root-logo">
          <div className="root-logo-icon">NR</div>
          <div>
            <div className="root-logo-name">NexusRoot</div>
            <div className="root-logo-sub">Painel da Plataforma</div>
          </div>
        </div>

        <nav className="root-nav">
          <div className="root-nav-label">Visão geral</div>
          <NavLink to="/" className={({ isActive }) => `root-nav-item${isActive ? ' active' : ''}`}>
            <Icon.Dashboard /> Dashboard
          </NavLink>

          <div className="root-nav-label">Gestão</div>
          <NavLink to="/tenants" className={({ isActive }) => `root-nav-item${isActive ? ' active' : ''}`}>
            <Icon.Tenants /> Tenants
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `root-nav-item${isActive ? ' active' : ''}`}>
            <Icon.Users /> Usuários
          </NavLink>
        </nav>

        <div className="root-sidebar-footer">
          <div style={{ padding: '6px 10px', marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{user?.name || 'ROOT'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Administrador da plataforma</div>
          </div>
          <button className="root-nav-item" onClick={handleLogout}>
            <Icon.Logout /> Sair
          </button>
        </div>
      </aside>

      <div className="root-main">
        <header className="root-topbar">
          <span className="root-topbar-title">{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-active" style={{ fontSize: 10 }}>● Sistema online</span>
          </div>
        </header>
        <main className="root-page animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
