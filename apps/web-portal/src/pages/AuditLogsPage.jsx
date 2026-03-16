import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';

const ACTION_BADGE = {
  INSERT: 'badge-success',
  UPDATE: 'badge-warning',
  DELETE: 'badge-danger',
  VIEW:   'badge-info',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AuditLogsPage() {
  const { get } = useApi();

  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filters, setFilters]   = useState({ action: '', table_name: '', from: '', to: '' });
  const [selected, setSelected] = useState(null);

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await get(`/audit-logs?${params}`);
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppLayout title="Trilha de Auditoria">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>Auditoria LGPD</h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
          {total} eventos registrados · Logs imutáveis (Art. 37 LGPD)
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
        <div>
          <label className="form-label" style={{fontSize:11}}>Ação</label>
          <select className="form-input" style={{width:130}} value={filters.action} onChange={e => setFilter('action', e.target.value)}>
            <option value="">Todas</option>
            {['VIEW','INSERT','UPDATE','DELETE'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" style={{fontSize:11}}>Tabela</label>
          <select className="form-input" style={{width:150}} value={filters.table_name} onChange={e => setFilter('table_name', e.target.value)}>
            <option value="">Todas</option>
            {['patients','appointments','consents','users','financial'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" style={{fontSize:11}}>De</label>
          <input className="form-input" type="date" style={{width:150}} value={filters.from} onChange={e => setFilter('from', e.target.value)} />
        </div>
        <div>
          <label className="form-label" style={{fontSize:11}}>Até</label>
          <input className="form-input" type="date" style={{width:150}} value={filters.to} onChange={e => setFilter('to', e.target.value)} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ action:'', table_name:'', from:'', to:'' })}>
          Limpar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
        {/* Tabela */}
        <div className="card">
          {error && <div className="card-body"><div className="alert alert-danger">⚠ {error}</div></div>}

          {!error && loading && (
            <div className="card-body">
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display:'flex', gap:12, marginBottom:12 }}>
                  <span className="skeleton" style={{width:60,height:16,borderRadius:4}} />
                  <span className="skeleton" style={{width:100,height:16,borderRadius:4}} />
                  <span className="skeleton" style={{flex:1,height:16,borderRadius:4}} />
                </div>
              ))}
            </div>
          )}

          {!error && !loading && logs.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Nenhum log encontrado</div>
              <div className="empty-state-desc">Ajuste os filtros ou aguarde novos eventos.</div>
            </div>
          )}

          {!error && !loading && logs.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Tabela</th>
                  <th>Usuário</th>
                  <th>IP</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(selected?.id === l.id ? null : l)}
                    style={{ cursor: 'pointer', background: selected?.id === l.id ? 'var(--accent-soft)' : undefined }}
                  >
                    <td>
                      <span className={`badge ${ACTION_BADGE[l.action] || 'badge-neutral'}`}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-2)' }}>
                      {l.table_name}
                    </td>
                    <td style={{ fontSize: 13 }}>{l.user_name || l.user_id?.slice(0,8) + '…' || 'Sistema'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-3)' }}>
                      {l.ip_address || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detalhe do log selecionado */}
        {selected && (
          <div className="card animate-fade-in" style={{ alignSelf: 'start', position: 'sticky', top: 72 }}>
            <div className="card-header">
              <span className="card-title">Detalhe do Evento</span>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body" style={{ fontSize: 13 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                <Row label="ID" value={<code style={{fontSize:11}}>{selected.id}</code>} />
                <Row label="Ação" value={<span className={`badge ${ACTION_BADGE[selected.action]}`}>{selected.action}</span>} />
                <Row label="Tabela" value={<code style={{fontSize:12}}>{selected.table_name}</code>} />
                <Row label="Registro" value={<code style={{fontSize:11}}>{selected.record_id || '—'}</code>} />
                <Row label="Usuário" value={selected.user_name || '—'} />
                <Row label="IP" value={selected.ip_address || '—'} />
                <Row label="Data/Hora" value={formatDate(selected.created_at)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{label}</span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}
