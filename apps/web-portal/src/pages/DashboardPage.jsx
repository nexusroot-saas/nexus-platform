import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';

const LABELS = {
  MED:    { entity: 'Pacientes',     appt: 'Consultas' },
  CLIN:   { entity: 'Clientes',      appt: 'Sessões' },
  ODONTO: { entity: 'Pacientes',     appt: 'Consultas' },
  LAB:    { entity: 'Requisitantes', appt: 'Coletas' },
  IMG:    { entity: 'Pacientes',     appt: 'Exames' },
  ADM:    { entity: 'Clientes',      appt: 'Atendimentos' },
};

const STATUS_BADGE = {
  AGENDADO:       'badge-info',
  CONFIRMADO:     'badge-success',
  EM_ATENDIMENTO: 'badge-warning',
  CONCLUIDO:      'badge-neutral',
  CANCELADO:      'badge-danger',
  FALTOU:         'badge-danger',
};

const STATUS_LABEL = {
  AGENDADO:       'Agendado',
  CONFIRMADO:     'Confirmado',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDO:      'Concluído',
  CANCELADO:      'Cancelado',
  FALTOU:         'Faltou',
};

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { get } = useApi();
  const labels = LABELS[user?.tenant_type] || LABELS.MED;

  const [stats, setStats]           = useState({ patients: '—', todayAppts: '—', pendingConsents: '—' });
  const [appointments, setAppts]    = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [patientsRes, apptsRes] = await Promise.all([
          get('/patients'),
          get(`/appointments?date=${todayISO()}`),
        ]);

        if (cancelled) return;

        setStats(prev => ({
          ...prev,
          patients:   patientsRes.total ?? 0,
          todayAppts: apptsRes.total ?? 0,
        }));

        // Consentimentos pendentes (só se tiver o módulo)
        if (user?.modules?.includes('NEXUSLEGAL')) {
          const consentsRes = await get('/consents?status=PENDENTE&limit=1').catch(() => null);
          if (!cancelled && consentsRes) {
            setStats(prev => ({ ...prev, pendingConsents: consentsRes.total ?? 0 }));
          }
        }

        setAppts(apptsRes.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const hasLegal = user?.modules?.includes('NEXUSLEGAL');

  return (
    <AppLayout title="Dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{labels.entity}</div>
          <div className="stat-value">{loading ? <span className="skeleton" style={{display:'inline-block',width:48,height:28}} /> : stats.patients}</div>
          <div className="stat-delta">total cadastrados</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{labels.appt} hoje</div>
          <div className="stat-value">{loading ? <span className="skeleton" style={{display:'inline-block',width:32,height:28}} /> : stats.todayAppts}</div>
          <div className="stat-delta">{todayISO()}</div>
        </div>

        {hasLegal && (
          <div className="stat-card">
            <div className="stat-label">Consentimentos pendentes</div>
            <div className="stat-value" style={{ color: stats.pendingConsents > 0 ? 'var(--warning)' : undefined }}>
              {loading ? <span className="skeleton" style={{display:'inline-block',width:32,height:28}} /> : stats.pendingConsents}
            </div>
            <div className="stat-delta">aguardando assinatura</div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-label">Tenant</div>
          <div className="stat-value" style={{ fontSize: 16, marginTop: 4 }}>{user?.tenant_type}</div>
          <div className="stat-delta">{user?.modules?.join(', ') || '—'}</div>
        </div>
      </div>

      {/* Agenda do dia */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{labels.appt} de hoje</span>
          <span className="badge badge-neutral">{todayISO()}</span>
        </div>

        {error && (
          <div className="card-body">
            <div className="alert alert-danger">⚠ {error}</div>
          </div>
        )}

        {!error && (
          loading ? (
            <div className="card-body">
              {[1,2,3].map(i => (
                <div key={i} style={{ display:'flex', gap:12, marginBottom:12 }}>
                  <span className="skeleton" style={{width:48,height:16,borderRadius:4}} />
                  <span className="skeleton" style={{flex:1,height:16,borderRadius:4}} />
                  <span className="skeleton" style={{width:80,height:16,borderRadius:4}} />
                </div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">Nenhum agendamento hoje</div>
              <div className="empty-state-desc">A agenda está livre para hoje.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>{labels.entity}</th>
                  <th>Duração</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 13 }}>
                      {formatTime(a.scheduled_date)}
                    </td>
                    <td style={{ fontWeight: 500 }}>{a.patient_name || '—'}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 13 }}>
                      {a.duration_minutes} min
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[a.status] || 'badge-neutral'}`}>
                        {STATUS_LABEL[a.status] || a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </AppLayout>
  );
}
