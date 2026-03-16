import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';

const LABELS = {
  MED:    'Paciente', CLIN: 'Cliente', ODONTO: 'Paciente',
  LAB:    'Requisitante', IMG: 'Paciente', ADM: 'Cliente',
};

// ── Modal de cadastro ─────────────────────────────────────────────────
function NewPatientModal({ label, onClose, onCreated }) {
  const { post } = useApi();
  const [form, setForm]     = useState({ name: '', email: '', phone: '', cpf: '', date_of_birth: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const res = await post('/patients', form);
      onCreated(res.data);
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Novo {label}</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && <div className="alert alert-danger" style={{marginBottom:14}}>⚠ {err}</div>}

            <div className="form-group">
              <label className="form-label">Nome completo *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="João da Silva" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">CPF</label>
                <input className="form-input" value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="form-group">
                <label className="form-label">Data de nascimento</label>
                <input className="form-input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="joao@email.com" />
            </div>

            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Telefone / WhatsApp</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(67) 99999-9999" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : `Cadastrar ${label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────
export default function PatientsPage() {
  const { user } = useAuth();
  const { get } = useApi();
  const label = LABELS[user?.tenant_type] || 'Paciente';

  const [patients, setPatients]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);

  const canCreate = ['TENANT_ADMIN', 'RECEPCIONISTA'].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await get('/patients');
      setPatients(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleCreated(patient) {
    setPatients(prev => [patient, ...prev]);
    setTotal(prev => prev + 1);
    setShowModal(false);
  }

  const filtered = patients.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf || '').includes(search)
  );

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  function getInitials(name = '') {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  return (
    <AppLayout title={`${label}s`}>
      {/* Header da página */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>{label}s</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            {loading ? '…' : `${total} ${total === 1 ? 'registro' : 'registros'}`}
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Novo {label}
          </button>
        )}
      </div>

      {/* Barra de busca */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="form-input"
          placeholder={`Buscar por nome, e-mail ou CPF…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Tabela */}
      <div className="card">
        {error && (
          <div className="card-body">
            <div className="alert alert-danger">⚠ {error}</div>
          </div>
        )}

        {!error && loading && (
          <div className="card-body">
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <span className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <span className="skeleton" style={{ display: 'block', width: '40%', height: 14, marginBottom: 6 }} />
                  <span className="skeleton" style={{ display: 'block', width: '60%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">
              {search ? `Nenhum resultado para "${search}"` : `Nenhum ${label.toLowerCase()} cadastrado`}
            </div>
            {canCreate && !search && (
              <div className="empty-state-desc">
                <button className="btn btn-primary btn-sm" style={{marginTop:12}} onClick={() => setShowModal(true)}>
                  Cadastrar primeiro {label.toLowerCase()}
                </button>
              </div>
            )}
          </div>
        )}

        {!error && !loading && filtered.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>{label}</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Nascimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600, flexShrink: 0,
                      }}>
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--text-2)' }}>
                    {p.cpf || '—'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.phone || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{formatDate(p.date_of_birth)}</td>
                  <td>
                    <span className={`badge ${p.status === 'ATIVO' ? 'badge-success' : 'badge-neutral'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewPatientModal
          label={label}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </AppLayout>
  );
}
