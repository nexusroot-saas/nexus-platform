import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerLayout from '../components/ManagerLayout.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';

const LABELS = {
  MED: 'Pacientes', CLIN: 'Clientes', ODONTO: 'Pacientes',
  LAB: 'Requisitantes', IMG: 'Pacientes', ADM: 'Clientes',
};

const ROLE_LABEL = {
  TENANT_ADMIN: 'Administrador', MEDICO: 'Médico',
  RECEPCIONISTA: 'Recepcionista', FINANCEIRO: 'Financeiro', DPO_EXTERNO: 'DPO Externo',
};

function StatCard({ label, value, sub, color, onClick, loading }) {
  return (
    <div className="stat-card" onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', transition: 'border-color .15s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
      <div className="stat-label">{label}</div>
      {loading
        ? <span className="skeleton" style={{ display: 'block', width: 48, height: 26, marginBottom: 4 }} />
        : <div className="stat-value" style={color ? { color } : {}}>{value ?? '—'}</div>
      }
      {sub && <div className="stat-delta">{sub}</div>}
    </div>
  );
}

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const { get } = useApi();
  const navigate = useNavigate();
  const label = LABELS[user?.tenant_type] || 'Pacientes';

  const [patients,  setPatients]  = useState([]);
  const [users,     setUsers]     = useState([]);
  const [appts,     setAppts]     = useState([]);
  const [consents,  setConsents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const hasLegal = user?.modules?.includes('NEXUSLEGAL');
  const isAdmin  = user?.role === 'TENANT_ADMIN';

  const todayISO = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const calls = [
        get('/patients'),
        get(`/appointments?date=${todayISO}`),
      ];
      if (isAdmin) calls.push(get('/manager/users'));
      if (hasLegal) calls.push(get('/consents?status=PENDENTE&limit=1'));

      const results = await Promise.allSettled(calls);

      if (results[0].status === 'fulfilled') setPatients(results[0].value.data || []);
      if (results[1].status === 'fulfilled') setAppts(results[1].value.data || []);
      if (isAdmin && results[2]?.status === 'fulfilled') setUsers(results[2].value.data || []);
      if (hasLegal) {
        const idx = isAdmin ? 3 : 2;
        if (results[idx]?.status === 'fulfilled') setConsents(results[idx].value.data || []);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingUsers   = users.filter(u => u.status === 'PENDING');
  const activeUsers    = users.filter(u => u.status === 'ACTIVE');
  const todayAppts     = appts.length;
  const pendingConsent = consents.length;

  const STATUS_COLOR = {
    AGENDADO: 'var(--color-action-info)', CONFIRMADO: 'var(--color-action-success)',
    EM_ATENDIMENTO: 'var(--color-action-warning)', CONCLUIDO: 'var(--color-text-tertiary)',
    CANCELADO: 'var(--color-action-danger)', FALTOU: 'var(--color-action-danger)',
  };

  return (
    <ManagerLayout title="NexusManager">
      {/* Boas-vindas */}
      <div style={{ marginBottom: 24, padding: '18px 20px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent)20' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
          Olá, {user?.name?.split(' ')[0]} 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {/* Alertas urgentes */}
      {pendingUsers.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16, cursor: 'pointer', background: 'var(--warning-soft)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}
          onClick={() => navigate('/manager/users')}>
          ⚠ {pendingUsers.length} usuário(s) aguardando aprovação — clique para revisar
        </div>
      )}
      {pendingConsent > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16, cursor: 'pointer', background: 'var(--warning-soft)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}
          onClick={() => navigate('/consents')}>
          ⚠ {pendingConsent} consentimento(s) LGPD pendente(s) — clique para gerenciar
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label={label}           value={patients.length} sub="cadastrados"      loading={loading} onClick={() => navigate('/patients')} />
        <StatCard label="Agenda hoje"     value={todayAppts}      sub={todayISO}          loading={loading} onClick={() => navigate('/appointments')} />
        {isAdmin && <StatCard label="Equipe ativa"   value={activeUsers.length}  sub="colaboradores" loading={loading} color="var(--color-action-success)" onClick={() => navigate('/manager/users')} />}
        {isAdmin && pendingUsers.length > 0 && (
          <StatCard label="Aguardando aprovação" value={pendingUsers.length} sub="novos cadastros" loading={loading} color="var(--color-action-warning)" onClick={() => navigate('/manager/users')} />
        )}
        {hasLegal && <StatCard label="Consentimentos pendentes" value={pendingConsent} sub="sem assinatura" loading={loading} color={pendingConsent > 0 ? 'var(--color-action-warning)' : undefined} onClick={() => navigate('/consents')} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Agenda do dia */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Agenda de hoje</span>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => navigate('/appointments')}>Ver tudo →</button>
          </div>
          {loading ? (
            <div className="card-body">{[1,2,3].map(i => <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}><span className="skeleton" style={{width:50,height:14}} /><span className="skeleton" style={{flex:1,height:14}} /></div>)}</div>
          ) : appts.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: .4 }}>📅</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Agenda livre hoje</div>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Horário</th><th>{label}</th><th>Status</th></tr></thead>
              <tbody>
                {appts.slice(0, 8).map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {a.scheduled_date ? new Date(a.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{a.patient_name || '—'}</td>
                    <td>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 100, background: STATUS_COLOR[a.status] + '20', color: STATUS_COLOR[a.status], fontWeight: 500 }}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Equipe + Ações rápidas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {isAdmin && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Equipe</span>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => navigate('/manager/users')}>Gerenciar →</button>
              </div>
              {loading ? (
                <div className="card-body">{[1,2,3].map(i => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'center' }}><span className="skeleton" style={{width:28,height:28,borderRadius:'50%'}} /><span className="skeleton" style={{flex:1,height:12}} /></div>)}</div>
              ) : users.length === 0 ? (
                <div style={{ padding: '16px 20px', color: 'var(--text-3)', fontSize: 13 }}>Nenhum colaborador cadastrado</div>
              ) : (
                <div style={{ padding: '12px 16px' }}>
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                        {u.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ROLE_LABEL[u.role] || u.role}</div>
                      </div>
                      {u.status === 'PENDING' && (
                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 100, background: 'var(--warning-soft)', color: 'var(--warning)', fontWeight: 500 }}>Pendente</span>
                      )}
                    </div>
                  ))}
                  {users.length > 5 && <div style={{ fontSize: 12, color: 'var(--text-3)', paddingTop: 4 }}>+{users.length - 5} colaboradores</div>}
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-header"><span className="card-title">Ações rápidas</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => navigate('/patients')} style={{ justifyContent: 'flex-start' }}>
                + Cadastrar {label.toLowerCase()}
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/appointments')} style={{ justifyContent: 'flex-start' }}>
                + Novo agendamento
              </button>
              {hasLegal && (
                <button className="btn btn-ghost" onClick={() => navigate('/consents')} style={{ justifyContent: 'flex-start' }}>
                  + Enviar termo de consentimento
                </button>
              )}
              {isAdmin && (
                <button className="btn btn-ghost" onClick={() => navigate('/manager/settings')} style={{ justifyContent: 'flex-start' }}>
                  ⚙ Configurações da unidade
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
