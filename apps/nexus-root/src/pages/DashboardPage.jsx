import { useState, useEffect } from 'react';
import RootLayout from '../components/RootLayout.jsx';
import { useRootApi } from '../hooks/useRootApi.js';

export default function RootDashboard() {
  const { get } = useRootApi();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    get('/root/stats')
      .then(res => setStats(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const S = ({ label, value, sub, color }) => (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{loading ? '—' : value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );

  return (
    <RootLayout title="Dashboard">
      {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>⚠ {error}</div>}

      <div className="stat-grid">
        <S label="Total de tenants"   value={stats?.total_tenants}    sub="na plataforma" />
        <S label="Tenants ativos"     value={stats?.active_tenants}    color="var(--success)" sub="plano ativo" />
        <S label="Em trial"           value={stats?.trial_tenants}     color="var(--info)" sub="período de teste" />
        <S label="Bloqueados"         value={stats?.blocked_tenants}   color="var(--danger)" sub="inadimplência" />
        <S label="Novos (30 dias)"    value={stats?.new_last_30d}      color="var(--accent)" sub="novos cadastros" />
        <S label="Total de usuários"  value={stats?.total_users}       sub="todos os tenants" />
      </div>

      {/* Aviso de tenant bloqueado */}
      {stats?.blocked_tenants > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          ⚠ {stats.blocked_tenants} tenant(s) bloqueado(s). Verifique a aba Tenants.
        </div>
      )}

      {/* Acesso rápido */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Ações rápidas</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/tenants" className="btn btn-ghost">+ Provisionar tenant</a>
          <a href="/tenants?status=TRIAL" className="btn btn-ghost">Ver trials</a>
          <a href="/tenants?status=BLOCKED" className="btn btn-ghost">Ver bloqueados</a>
        </div>
      </div>
    </RootLayout>
  );
}
