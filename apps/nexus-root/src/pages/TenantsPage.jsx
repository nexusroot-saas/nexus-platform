import { useState, useEffect, useCallback } from 'react';
import RootLayout from '../components/RootLayout.jsx';
import { useRootApi } from '../hooks/useRootApi.js';

const MODULES = ['NEXUSMED', 'NEXUSCLIN', 'NEXUSODONTO', 'NEXUSLAB', 'NEXUSIMG', 'NEXUSLEGAL', 'NEXUSADM'];
const TENANT_TYPES = ['MED', 'CLIN', 'ODONTO', 'LAB', 'IMG', 'ADM'];

const STATUS_BADGE = {
  ACTIVE:    'badge-active',
  TRIAL:     'badge-trial',
  BLOCKED:   'badge-blocked',
  CANCELLED: 'badge-cancelled',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

// ── Modal Provisionar ─────────────────────────────────────────────────────
function ProvisionModal({ onClose, onCreated }) {
  const { post } = useRootApi();
  const [form, setForm] = useState({ nome_fantasia: '', cnpj: '', razao_social: '', tenant_type: 'MED', active_modules: ['NEXUSLEGAL'], trial_days: 30 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleModule = m => setForm(p => ({ ...p, active_modules: p.active_modules.includes(m) ? p.active_modules.filter(x => x !== m) : [...p.active_modules, m] }));

  async function handleSubmit(e) {
    e.preventDefault(); setErr(''); setSaving(true);
    try { const res = await post('/root/tenants', form); onCreated(res.data); }
    catch (error) { setErr(error.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Provisionar Novo Tenant</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && <div className="alert alert-danger" style={{ marginBottom: 14 }}>⚠ {err}</div>}
            <div className="form-group">
              <label className="form-label">Nome fantasia *</label>
              <input className="form-input" value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)} placeholder="Clínica São Lucas" required />
            </div>
            <div className="form-group">
              <label className="form-label">Razão social</label>
              <input className="form-input" value={form.razao_social} onChange={e => set('razao_social', e.target.value)} placeholder="Clínica São Lucas LTDA" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input className="form-input" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select className="form-input" value={form.tenant_type} onChange={e => set('tenant_type', e.target.value)}>
                  {TENANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dias de trial</label>
              <input className="form-input" type="number" min={0} max={365} value={form.trial_days} onChange={e => set('trial_days', Number(e.target.value))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Módulos ativos</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {MODULES.map(m => (
                  <button key={m} type="button" className={`btn btn-sm ${form.active_modules.includes(m) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleModule(m)} style={{ fontSize: 11 }}>
                    {m.replace('NEXUS', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Provisionando…' : 'Criar Tenant'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Editar Tenant ───────────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onSaved }) {
  const { patch } = useRootApi();
  const [form, setForm] = useState({
    nome_fantasia: tenant.nome_fantasia || '',
    razao_social:  tenant.razao_social  || '',
    cnpj:          tenant.cnpj          || '',
    tenant_type:   tenant.tenant_type   || 'MED',
    status:        tenant.status        || 'ACTIVE',
    active_modules: tenant.active_modules || [],
  });
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleModule = m => setForm(p => ({ ...p, active_modules: p.active_modules.includes(m) ? p.active_modules.filter(x => x !== m) : [...p.active_modules, m] }));

  async function handleSubmit(e) {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const updates = [];
      if (form.status !== tenant.status) {
        updates.push(patch(`/root/tenants/${tenant.id}/status`, { status: form.status }));
      }
      if (JSON.stringify(form.active_modules.sort()) !== JSON.stringify((tenant.active_modules || []).sort())) {
        updates.push(patch(`/root/tenants/${tenant.id}/modules`, { active_modules: form.active_modules }));
      }
      await Promise.all(updates);
      setSuccess(true);
      setTimeout(() => { onSaved({ ...tenant, ...form }); }, 800);
    } catch (error) { setErr(error.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Editar Tenant</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && <div className="alert alert-danger" style={{ marginBottom: 14 }}>⚠ {err}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 14 }}>✓ Tenant atualizado.</div>}

            <div style={{ padding: '8px 12px', background: 'var(--surface-3)', borderRadius: 6, marginBottom: 14, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              ID: {tenant.id}
            </div>

            <div className="form-group">
              <label className="form-label">Nome fantasia</label>
              <input className="form-input" value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Razão social</label>
              <input className="form-input" value={form.razao_social} onChange={e => set('razao_social', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input className="form-input" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-input" value={form.tenant_type} onChange={e => set('tenant_type', e.target.value)}>
                  {TENANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Módulos ativos</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {MODULES.map(m => (
                  <button key={m} type="button" className={`btn btn-sm ${form.active_modules.includes(m) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleModule(m)} style={{ fontSize: 11 }}>
                    {m.replace('NEXUS', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Fechar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || success}>{saving ? 'Salvando…' : 'Salvar alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────
export default function TenantsPage() {
  const { get, patch, del } = useRootApi();
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilter] = useState('');
  const [showProvision, setShowProvision] = useState(false);
  const [editTenant, setEditTenant]       = useState(null);
  const [changing, setChanging]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const res = await get('/root/tenants'); setTenants(res.data || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(tenant, status) {
    setChanging(tenant.id);
    try {
      const res = await patch(`/root/tenants/${tenant.id}/status`, { status });
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, ...res.data } : t));
    } catch (err) { alert(err.message); }
    finally { setChanging(null); }
  }

  const filtered = tenants.filter(t =>
    (!filterStatus || t.status === filterStatus) &&
    (!search || t.nome_fantasia.toLowerCase().includes(search.toLowerCase()) || (t.cnpj || '').includes(search))
  );

  return (
    <RootLayout title="Tenants">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px' }}>Tenants</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{tenants.length} empresas na plataforma</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowProvision(true)}>+ Provisionar</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 260 }} placeholder="Buscar por nome ou CNPJ…" value={search} onChange={e => setSearch(e.target.value)} />
        {['', 'ACTIVE', 'TRIAL', 'BLOCKED', 'CANCELLED'].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)}>
            {s || 'Todos'}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      <div className="card">
        {loading ? (
          <div className="card-body">{[1,2,3].map(i => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:12 }}>
              <span className="skeleton" style={{width:'30%',height:16,borderRadius:4}} />
              <span className="skeleton" style={{width:'20%',height:16,borderRadius:4}} />
              <span className="skeleton" style={{width:'15%',height:16,borderRadius:4}} />
            </div>
          ))}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <div className="empty-title">Nenhum tenant encontrado</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Empresa</th><th>Tipo</th><th>Status</th><th>Módulos</th><th>Usuários</th><th>Trial até</th><th>Criado em</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{t.nome_fantasia}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{t.cnpj || '—'}</div>
                  </td>
                  <td><span style={{ fontSize: 12, color: 'var(--text-2)' }}>{t.tenant_type}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-cancelled'}`}>{t.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {(t.active_modules || []).map(m => (
                        <span key={m} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--accent-soft)', color: '#a78bfa' }}>
                          {m.replace('NEXUS', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{t.user_count}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDate(t.trial_expires_at)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDate(t.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditTenant(t)}>✏ Editar</button>
                      {t.status !== 'ACTIVE' && (
                        <button className="btn btn-sm" disabled={changing === t.id} style={{ background: 'var(--success-soft)', color: 'var(--success)' }} onClick={() => changeStatus(t, 'ACTIVE')}>Ativar</button>
                      )}
                      {t.status === 'ACTIVE' && (
                        <button className="btn btn-danger btn-sm" disabled={changing === t.id} onClick={() => changeStatus(t, 'BLOCKED')}>Bloquear</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showProvision && <ProvisionModal onClose={() => setShowProvision(false)} onCreated={(t) => { setTenants(prev => [t, ...prev]); setShowProvision(false); }} />}
      {editTenant && <EditTenantModal tenant={editTenant} onClose={() => setEditTenant(null)} onSaved={(updated) => { setTenants(prev => prev.map(t => t.id === updated.id ? updated : t)); setEditTenant(null); }} />}
    </RootLayout>
  );
}
