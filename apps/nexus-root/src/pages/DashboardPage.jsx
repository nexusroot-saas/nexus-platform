import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RootLayout from '../components/RootLayout.jsx';
import { useRootApi } from '../hooks/useRootApi.js';

function StatCard({ label, value, sub, color, loading, onClick }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div className="stat-label">{label}</div>
      {loading ? (
        <span
          className="skeleton"
          style={{ display: 'block', width: 48, height: 28, marginBottom: 4 }}
        />
      ) : (
        <div className="stat-value" style={color ? { color } : {}}>
          {value ?? '—'}
        </div>
      )}
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function TenantRow({ t, navigate }) {
  const statusColor = {
    ACTIVE: 'var(--success)',
    TRIAL: 'var(--info)',
    BLOCKED: 'var(--danger)',
    CANCELLED: 'var(--text-3)',
  };
  return (
    <tr style={{ cursor: 'pointer' }} onClick={() => navigate('/tenants')}>
      <td>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{t.nome_fantasia}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {t.tenant_type}
        </div>
      </td>
      <td>
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 100,
            fontWeight: 500,
            background:
              t.status === 'ACTIVE'
                ? 'var(--success-soft)'
                : t.status === 'TRIAL'
                  ? 'var(--info-soft)'
                  : t.status === 'BLOCKED'
                    ? 'var(--danger-soft)'
                    : 'var(--surface-3)',
            color: statusColor[t.status] || 'var(--text-3)',
          }}
        >
          {t.status}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {(t.active_modules || []).slice(0, 4).map((m) => (
            <span
              key={m}
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 4,
                background: 'var(--accent-soft)',
                color: '#a78bfa',
              }}
            >
              {m.replace('NEXUS', '')}
            </span>
          ))}
          {(t.active_modules || []).length > 4 && (
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
              +{t.active_modules.length - 4}
            </span>
          )}
        </div>
      </td>
      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
        {t.user_count || 0} usuários
      </td>
      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
        {t.created_at
          ? new Date(t.created_at).toLocaleDateString('pt-BR')
          : '—'}
      </td>
    </tr>
  );
}

export default function RootDashboard() {
  const { get } = useRootApi();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        get('/root/stats'),
        get('/root/tenants'),
      ]);
      setStats(statsRes.data);
      setTenants(tenantsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStats(false);
      setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const recentTenants = tenants.slice(0, 5);
  const blockedTenants = tenants.filter((t) => t.status === 'BLOCKED');
  const trialTenants = tenants.filter((t) => t.status === 'TRIAL');
  const totalModuleUsage = tenants.reduce((acc, t) => {
    (t.active_modules || []).forEach((m) => {
      acc[m] = (acc[m] || 0) + 1;
    });
    return acc;
  }, {});

  return (
    <RootLayout title="Dashboard">
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          ⚠ {error} —{' '}
          <button
            className="btn btn-ghost btn-sm"
            onClick={loadAll}
            style={{ marginLeft: 8 }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="stat-grid">
        <StatCard
          label="Total de tenants"
          value={stats?.total_tenants}
          sub="na plataforma"
          loading={loadingStats}
          onClick={() => navigate('/tenants')}
        />
        <StatCard
          label="Ativos"
          value={stats?.active_tenants}
          sub="plano ativo"
          loading={loadingStats}
          color="var(--success)"
          onClick={() => navigate('/tenants')}
        />
        <StatCard
          label="Em trial"
          value={stats?.trial_tenants}
          sub="período de teste"
          loading={loadingStats}
          color="var(--info)"
          onClick={() => navigate('/tenants')}
        />
        <StatCard
          label="Bloqueados"
          value={stats?.blocked_tenants}
          sub="aguardam pagamento"
          loading={loadingStats}
          color="var(--danger)"
          onClick={() => navigate('/tenants')}
        />
        <StatCard
          label="Novos (30 dias)"
          value={stats?.new_last_30d}
          sub="últimos 30 dias"
          loading={loadingStats}
          color="var(--accent)"
        />
        <StatCard
          label="Total de usuários"
          value={stats?.total_users}
          sub="todos os tenants"
          loading={loadingStats}
          onClick={() => navigate('/users')}
        />
      </div>

      {/* ── Alertas ─────────────────────────────────────────────────── */}
      {blockedTenants.length > 0 && (
        <div
          className="alert alert-danger"
          style={{ marginBottom: 16, cursor: 'pointer' }}
          onClick={() => navigate('/tenants')}
        >
          ⚠ {blockedTenants.length} tenant(s) bloqueado(s):{' '}
          {blockedTenants.map((t) => t.nome_fantasia).join(', ')} — Clique para
          gerenciar
        </div>
      )}
      {trialTenants.length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--info-soft)',
            color: 'var(--info)',
            fontSize: 13,
            marginBottom: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => navigate('/tenants')}
        >
          ℹ {trialTenants.length} tenant(s) em período trial — considere
          acompanhar a conversão
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* ── Tenants recentes ──────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tenants recentes</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/tenants')}
            >
              Ver todos →
            </button>
          </div>
          {loadingTenants ? (
            <div className="card-body">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 10, marginBottom: 12 }}
                >
                  <span
                    className="skeleton"
                    style={{ width: '40%', height: 14 }}
                  />
                  <span
                    className="skeleton"
                    style={{ width: '20%', height: 14 }}
                  />
                </div>
              ))}
            </div>
          ) : recentTenants.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: 'var(--text-3)',
                fontSize: 13,
              }}
            >
              Nenhum tenant cadastrado
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Status</th>
                  <th>Módulos</th>
                  <th>Usuários</th>
                  <th>Criado</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((t) => (
                  <TenantRow key={t.id} t={t} navigate={navigate} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Adoção de módulos ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Adoção de módulos</span>
            </div>
            <div className="card-body">
              {loadingTenants ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', gap: 10, marginBottom: 10 }}
                  >
                    <span
                      className="skeleton"
                      style={{ width: '30%', height: 12 }}
                    />
                    <span
                      className="skeleton"
                      style={{ flex: 1, height: 12 }}
                    />
                  </div>
                ))
              ) : Object.keys(totalModuleUsage).length === 0 ? (
                <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
                  Sem dados
                </div>
              ) : (
                Object.entries(totalModuleUsage)
                  .sort(([, a], [, b]) => b - a)
                  .map(([mod, count]) => {
                    const pct = Math.round(
                      (count / (tenants.length || 1)) * 100
                    );
                    return (
                      <div key={mod} style={{ marginBottom: 10 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 4,
                            fontSize: 12,
                          }}
                        >
                          <span
                            style={{ color: 'var(--text-2)', fontWeight: 500 }}
                          >
                            {mod.replace('NEXUS', 'Nexus')}
                          </span>
                          <span style={{ color: 'var(--text-3)' }}>
                            {count} tenant{count !== 1 ? 's' : ''} · {pct}%
                          </span>
                        </div>
                        <div
                          style={{
                            background: 'var(--surface-3)',
                            borderRadius: 4,
                            height: 6,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: 'var(--accent)',
                              borderRadius: 4,
                              transition: 'width .5s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* ── Ações rápidas ──────────────────────────────────────── */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ações rápidas</span>
            </div>
            <div
              className="card-body"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <button
                className="btn btn-primary"
                onClick={() => navigate('/tenants')}
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              >
                🏢 Provisionar novo tenant
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/users')}
                style={{ justifyContent: 'flex-start' }}
              >
                👤 Criar usuário gestor
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/tenants')}
                style={{ justifyContent: 'flex-start' }}
              >
                📋 Gerenciar licenças e módulos
              </button>
              <button
                className="btn btn-ghost"
                onClick={loadAll}
                style={{ justifyContent: 'flex-start' }}
              >
                🔄 Atualizar dados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Distribuição por tipo ─────────────────────────────────── */}
      {!loadingTenants && tenants.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Distribuição por tipo de tenant</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(
                tenants.reduce((acc, t) => {
                  acc[t.tenant_type] = (acc[t.tenant_type] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const colors = {
                    MED: '#1a6cff',
                    CLIN: '#e8457a',
                    ODONTO: '#16a34a',
                    LAB: '#7c3aed',
                    IMG: '#ea580c',
                    ADM: '#0d9488',
                  };
                  const color = colors[type] || 'var(--accent)';
                  return (
                    <div
                      key={type}
                      style={{
                        flex: 1,
                        minWidth: 100,
                        padding: '14px 16px',
                        background: 'var(--surface-2)',
                        borderRadius: 10,
                        border: `1px solid ${color}30`,
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color,
                          marginBottom: 2,
                        }}
                      >
                        {count}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-3)',
                          fontWeight: 500,
                        }}
                      >
                        Nexus{type.charAt(0) + type.slice(1).toLowerCase()}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </RootLayout>
  );
}
