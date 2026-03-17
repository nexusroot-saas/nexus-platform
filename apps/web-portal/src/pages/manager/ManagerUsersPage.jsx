import { useState, useEffect, useCallback } from 'react';
import ManagerLayout from '../../components/ManagerLayout.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';

const ROLES = ['MEDICO', 'RECEPCIONISTA', 'FINANCEIRO', 'DPO_EXTERNO'];

const ROLE_LABEL = {
  TENANT_ADMIN: 'Administrador', MEDICO: 'Médico',
  RECEPCIONISTA: 'Recepcionista', FINANCEIRO: 'Financeiro', DPO_EXTERNO: 'DPO Externo',
};

const STATUS_INFO = {
  ACTIVE:  { cls: 'badge-success', label: 'Ativo' },
  BLOCKED: { cls: 'badge-danger',  label: 'Bloqueado' },
  PENDING: { cls: 'badge-warning', label: 'Pendente' },
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Modal Convidar ────────────────────────────────────────────────────────
function InviteModal({ onClose, onCreated }) {
  const { post } = useApi();
  const [form, setForm] = useState({ name: '', email: '', role: 'RECEPCIONISTA', password: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const res = await post('/manager/users', form);
      onCreated(res.data);
    } catch (error) { setErr(error.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Convidar Colaborador</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && <div className="alert alert-danger" style={{ marginBottom: 14 }}>⚠ {err}</div>}
            <div className="form-group">
              <label className="form-label">Nome completo *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. João Silva" required />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="joao@clinica.com.br" required />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo *</label>
              <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Senha provisória *</label>
              <input className="form-input" type="password" minLength={8} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" required />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                O colaborador ficará pendente de aprovação até ser ativado.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Criando…' : 'Criar e aguardar aprovação'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Editar ──────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }) {
  const { patch } = useApi();
  const [form, setForm] = useState({ name: user.name, role: user.role });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const res = await patch(`/manager/users/${user.id}`, form);
      setSuccess(true);
      setTimeout(() => onSaved(res.data), 700);
    } catch (error) { setErr(error.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Editar Colaborador</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && <div className="alert alert-danger" style={{ marginBottom: 14 }}>⚠ {err}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 14 }}>✓ Atualizado com sucesso.</div>}
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cargo</label>
              <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)} disabled={user.role === 'TENANT_ADMIN'}>
                {(user.role === 'TENANT_ADMIN' ? ['TENANT_ADMIN'] : ROLES).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Fechar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || success}>{saving ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Aprovar ─────────────────────────────────────────────────────────
function ApproveModal({ user, onClose, onApproved }) {
  const { patch } = useApi();
  const [role, setRole]     = useState(user.role || 'RECEPCIONISTA');
  const [saving, setSaving] = useState(false);

  async function handleApprove() {
    setSaving(true);
    try {
      const res = await patch(`/manager/users/${user.id}/approve`, { role });
      onApproved(res.data);
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Aprovar acesso — {user.name}</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
            Defina o cargo antes de liberar o acesso:
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cargo</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleApprove} disabled={saving}>{saving ? 'Aprovando…' : '✓ Aprovar acesso'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
export default function ManagerUsersPage() {
  const { user: me } = useAuth();
  const { get, patch, del } = useApi();

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showInvite, setShowInvite]   = useState(false);
  const [editUser, setEditUser]       = useState(null);
  const [approveUser, setApproveUser] = useState(null);
  const [acting, setActing]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await get('/manager/users');
      setUsers(res.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(user) {
    const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    if (!confirm(`${newStatus === 'BLOCKED' ? 'Bloquear' : 'Ativar'} "${user.name}"?`)) return;
    setActing(user.id);
    try {
      const res = await patch(`/manager/users/${user.id}`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...res.data } : u));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  }

  async function removeUser(user) {
    if (!confirm(`Desligar "${user.name}"? O acesso será bloqueado imediatamente.`)) return;
    setActing(user.id);
    try {
      await del(`/manager/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  }

  const pending = users.filter(u => u.status === 'PENDING');
  const active  = users.filter(u => u.status !== 'PENDING');

  return (
    <ManagerLayout title="Equipe">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>Equipe</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{users.length} colaboradores cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>+ Convidar colaborador</button>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {/* Pendentes de aprovação */}
      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 16, border: '1px solid var(--warning)40' }}>
          <div className="card-header" style={{ background: 'var(--warning-soft)' }}>
            <span className="card-title" style={{ color: 'var(--warning)' }}>⚠ {pending.length} aguardando aprovação</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Colaborador</th><th>E-mail</th><th>Cadastro</th><th>Ação</th></tr></thead>
            <tbody>
              {pending.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{u.email}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: 'var(--success-soft)', color: 'var(--success)' }} onClick={() => setApproveUser(u)}>✓ Aprovar</button>
                      <button className="btn btn-danger btn-sm" disabled={acting === u.id} onClick={() => removeUser(u)}>✕ Recusar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Colaboradores ativos */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Colaboradores</span>
        </div>
        {loading ? (
          <div className="card-body">{[1,2,3].map(i => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:14, alignItems:'center' }}>
              <span className="skeleton" style={{ width:34,height:34,borderRadius:'50%' }} />
              <div style={{ flex:1 }}>
                <span className="skeleton" style={{ display:'block', width:'35%', height:13, marginBottom:5 }} />
                <span className="skeleton" style={{ display:'block', width:'55%', height:11 }} />
              </div>
            </div>
          ))}</div>
        ) : active.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">Nenhum colaborador ativo</div>
            <div className="empty-state-desc">
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowInvite(true)}>Convidar primeiro colaborador</button>
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Colaborador</th><th>Cargo</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead>
            <tbody>
              {active.map(u => {
                const si = STATUS_INFO[u.status] || { cls: 'badge-neutral', label: u.status };
                const isMe = u.id === me?.sub;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, flexShrink:0 }}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:500 }}>{u.name} {isMe && <span style={{ fontSize:10, color:'var(--text-3)' }}>(você)</span>}</div>
                          <div style={{ fontSize:12, color:'var(--text-3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize:12 }}>{ROLE_LABEL[u.role] || u.role}</span></td>
                    <td><span className={`badge ${si.cls}`}>{si.label}</span></td>
                    <td style={{ fontSize:12, color:'var(--text-3)' }}>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                    <td>
                      {!isMe && u.role !== 'TENANT_ADMIN' && (
                        <div style={{ display:'flex', gap:5 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditUser(u)}>✏ Editar</button>
                          <button className="btn btn-ghost btn-sm" disabled={acting === u.id} onClick={() => toggleStatus(u)}>
                            {u.status === 'ACTIVE' ? 'Bloquear' : 'Ativar'}
                          </button>
                          <button className="btn btn-danger btn-sm" disabled={acting === u.id} onClick={() => removeUser(u)}>Desligar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showInvite  && <InviteModal onClose={() => setShowInvite(false)} onCreated={u => { setUsers(prev => [...prev, u]); setShowInvite(false); }} />}
      {editUser    && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={u => { setUsers(prev => prev.map(x => x.id === u.id ? { ...x, ...u } : x)); setEditUser(null); }} />}
      {approveUser && <ApproveModal user={approveUser} onClose={() => setApproveUser(null)} onApproved={u => { setUsers(prev => prev.map(x => x.id === u.id ? { ...x, ...u } : x)); setApproveUser(null); }} />}
    </ManagerLayout>
  );
}
