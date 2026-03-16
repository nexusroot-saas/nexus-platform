import { useState, useEffect, useCallback } from 'react';
import RootLayout from '../components/RootLayout.jsx';
import { useRootApi } from '../hooks/useRootApi.js';

const ROLES = ['ROOT', 'TENANT_ADMIN', 'MEDICO', 'RECEPCIONISTA', 'FINANCEIRO', 'DPO_EXTERNO'];

const STATUS_BADGE = {
  ACTIVE:  { cls: 'badge-active',   label: 'Ativo' },
  BLOCKED: { cls: 'badge-blocked',  label: 'Bloqueado' },
  PENDING: { cls: 'badge-trial',    label: 'Pendente' },
};

const ROLE_COLOR = {
  ROOT:          { bg: '#1e1333', color: '#a78bfa' },
  TENANT_ADMIN:  { bg: '#0d2117', color: '#3fb950' },
  MEDICO:        { bg: '#0d1f35', color: '#58a6ff' },
  RECEPCIONISTA: { bg: '#1c1505', color: '#d29922' },
  FINANCEIRO:    { bg: '#1a0e06', color: '#fb923c' },
  DPO_EXTERNO:   { bg: '#1a1a18', color: '#8b949e' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Modal Reset Senha ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose, onReset }) {
  const { post } = useRootApi();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setErr('Senhas não coincidem.'); return; }
    if (password.length < 8)  { setErr('Mínimo 8 caracteres.'); return; }
    setSaving(true); setErr('');
    try {
      await post(`/root/users/${user.id}/reset-password`, { new_password: password });
      onReset();
    } catch (error) { setErr(error.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Redefinir senha — {user.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && <div className="alert alert-danger" style={{ marginBottom: 14 }}>⚠ {err}</div>}
            <div className="form-group">
              <label className="form-label">Nova senha</label>
              <input className="form-input" type="password" minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirmar senha</label>
              <input className="form-input" type="password"
                placeholder="Repita a senha"
                value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Redefinir senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Alterar Role ────────────────────────────────────────────────────
function ChangeRoleModal({ user, onClose, onChanged }) {
  const { patch } = useRootApi();
  const [role, setRole]     = useState(user.role);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await patch(`/root/users/${user.id}/role`, { role });
      onChanged(res.data);
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Alterar role — {user.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Role</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
export default function UsersPage() {
  const { get, patch, del } = useRootApi();

  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterRole, setFilterRole]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [resetUser, setResetUser]       = useState(null);
  const [changeRoleUser, setChangeRoleUser] = useState(null);
  const [acting, setActing]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search)       params.set('search', search);
      if (filterRole)   params.set('role', filterRole);
      if (filterStatus) params.set('status', filterStatus);
      params.set('limit', '100');

      const res = await get(`/root/users?${params}`);
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [search, filterRole, filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(user, status) {
    setActing(user.id);
    try {
      const res = await patch(`/root/users/${user.id}/status`, { status });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...res.data } : u));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  }

  async function deleteUser(user) {
    if (!confirm(`Remover usuário "${user.name}"? Esta ação não pode ser desfeita.`)) return;
    setActing(user.id);
    try {
      await del(`/root/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setTotal(prev => prev - 1);
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  }

  return (
    <RootLayout title="Usuários">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px' }}>Usuários</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{total} usuários na plataforma</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input className="form-input" style={{ maxWidth: 260 }}
          placeholder="Buscar por nome ou e-mail…"
          value={search} onChange={e => setSearch(e.target.value)} />

        <select className="form-input" style={{ width: 160 }}
          value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">Todos os roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select className="form-input" style={{ width: 140 }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="BLOCKED">Bloqueado</option>
          <option value="PENDING">Pendente</option>
        </select>

        {(search || filterRole || filterStatus) && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }}>
            Limpar
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      <div className="card">
        {loading ? (
          <div className="card-body">
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
                <span className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <span className="skeleton" style={{ display: 'block', width: '35%', height: 13, marginBottom: 5 }} />
                  <span className="skeleton" style={{ display: 'block', width: '55%', height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div className="empty-title">Nenhum usuário encontrado</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Role</th>
                <th>Tenant</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const roleStyle = ROLE_COLOR[u.role] || ROLE_COLOR.DPO_EXTERNO;
                const statusInfo = STATUS_BADGE[u.status] || { cls: 'badge-cancelled', label: u.status };

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: roleStyle.bg, color: roleStyle.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 600, flexShrink: 0,
                        }}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, padding: '2px 7px', borderRadius: 4,
                        background: roleStyle.bg, color: roleStyle.color, fontWeight: 500,
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{u.company_name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{u.tenant_type}</div>
                    </td>
                    <td>
                      <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {formatDate(u.last_login_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {u.status !== 'ACTIVE' && (
                          <button className="btn btn-sm" disabled={acting === u.id}
                            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                            onClick={() => changeStatus(u, 'ACTIVE')}>
                            Ativar
                          </button>
                        )}
                        {u.status === 'ACTIVE' && u.role !== 'ROOT' && (
                          <button className="btn btn-danger btn-sm" disabled={acting === u.id}
                            onClick={() => changeStatus(u, 'BLOCKED')}>
                            Bloquear
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => setChangeRoleUser(u)}>
                          Role
                        </button>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => setResetUser(u)}>
                          Senha
                        </button>
                        {u.role !== 'ROOT' && (
                          <button className="btn btn-danger btn-sm" disabled={acting === u.id}
                            onClick={() => deleteUser(u)}>
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onReset={() => { setResetUser(null); alert('Senha redefinida com sucesso!'); }}
        />
      )}

      {changeRoleUser && (
        <ChangeRoleModal
          user={changeRoleUser}
          onClose={() => setChangeRoleUser(null)}
          onChanged={(updated) => {
            setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
            setChangeRoleUser(null);
          }}
        />
      )}
    </RootLayout>
  );
}
