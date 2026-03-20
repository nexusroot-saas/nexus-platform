import { useState, useEffect, useCallback } from 'react';
import RootLayout from '../components/RootLayout.jsx';
import { useRootApi } from '../hooks/useRootApi.js';

const ROLES = [
  'TENANT_ADMIN',
  'MEDICO',
  'RECEPCIONISTA',
  'FINANCEIRO',
  'DPO_EXTERNO',
];

const STATUS_BADGE = {
  ACTIVE: { cls: 'badge-active', label: 'Ativo' },
  BLOCKED: { cls: 'badge-blocked', label: 'Bloqueado' },
  PENDING: { cls: 'badge-trial', label: 'Pendente' },
};

const ROLE_COLOR = {
  ROOT: { bg: '#1e1333', color: '#a78bfa' },
  TENANT_ADMIN: { bg: '#0d2117', color: '#3fb950' },
  MEDICO: { bg: '#0d1f35', color: '#58a6ff' },
  RECEPCIONISTA: { bg: '#1c1505', color: '#d29922' },
  FINANCEIRO: { bg: '#1a0e06', color: '#fb923c' },
  DPO_EXTERNO: { bg: '#1a1a18', color: '#8b949e' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ── Modal Criar Usuário ───────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }) {
  const { get, post } = useRootApi();
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({
    company_id: '',
    name: '',
    email: '',
    password: '',
    role: 'TENANT_ADMIN',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    get('/root/tenants')
      .then((res) => setTenants(res.data || []))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const res = await post('/root/users', form);
      onCreated(res.data);
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Novo Usuário Gestor</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && (
              <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                ⚠ {err}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Tenant *</label>
              <select
                className="form-input"
                value={form.company_id}
                onChange={(e) => set('company_id', e.target.value)}
                required
              >
                <option value="">Selecione o tenant…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome_fantasia} ({t.tenant_type})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nome completo *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="João da Silva"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="joao@clinica.com.br"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                className="form-input"
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Senha provisória *</label>
              <input
                className="form-input"
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Criando…' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Editar Usuário ──────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }) {
  const { patch } = useRootApi();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      // Atualiza role e status em paralelo se mudaram
      const updates = [];
      if (form.role !== user.role)
        updates.push(patch(`/root/users/${user.id}/role`, { role: form.role }));
      if (form.status !== user.status)
        updates.push(
          patch(`/root/users/${user.id}/status`, { status: form.status })
        );
      const results = await Promise.all(updates);
      const updated =
        results.length > 0 ? results[results.length - 1].data : user;
      setSuccess(true);
      setTimeout(() => {
        onSaved({ ...user, ...updated, ...form });
      }, 800);
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Editar Usuário</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && (
              <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                ⚠ {err}
              </div>
            )}
            {success && (
              <div className="alert alert-success" style={{ marginBottom: 14 }}>
                ✓ Usuário atualizado.
              </div>
            )}

            <div
              style={{
                padding: '10px 14px',
                background: 'var(--surface-3)',
                borderRadius: 8,
                marginBottom: 14,
                fontSize: 12,
                color: 'var(--text-2)',
              }}
            >
              <strong>{user.name}</strong> · {user.company_name} (
              {user.tenant_type})
            </div>

            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  disabled={user.role === 'ROOT'}
                >
                  {(user.role === 'ROOT' ? ['ROOT'] : ROLES).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  disabled={user.role === 'ROOT'}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="BLOCKED">Bloqueado</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Fechar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || success}
            >
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Reset Senha ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }) {
  const { post } = useRootApi();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setErr('Senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setErr('Mínimo 8 caracteres.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await post(`/root/users/${user.id}/reset-password`, {
        new_password: password,
      });
      setSuccess(true);
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Redefinir senha — {user.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        {success ? (
          <>
            <div className="modal-body">
              <div className="alert alert-success">
                ✓ Senha redefinida com sucesso.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={onClose}>
                Fechar
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {err && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: 14 }}
                >
                  ⚠ {err}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Nova senha</label>
                <input
                  className="form-input"
                  type="password"
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirmar senha</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Redefinir'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { get, del } = useRootApi();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterRole) params.set('role', filterRole);
      if (filterStatus) params.set('status', filterStatus);
      params.set('limit', '100');
      const res = await get(`/root/users?${params}`);
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteUser(user) {
    if (!confirm(`Remover "${user.name}"?`)) return;
    setActing(user.id);
    try {
      await del(`/root/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  }

  return (
    <RootLayout title="Usuários">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px' }}
          >
            Usuários
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {loading ? '…' : `${total} usuários na plataforma`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Novo usuário gestor
        </button>
      </div>

      <div
        style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}
      >
        <input
          className="form-input"
          style={{ maxWidth: 260 }}
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input"
          style={{ width: 170 }}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Todos os roles</option>
          {['ROOT', ...ROLES].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          style={{ width: 140 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="BLOCKED">Bloqueado</option>
          <option value="PENDING">Pendente</option>
        </select>
        {(search || filterRole || filterStatus) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearch('');
              setFilterRole('');
              setFilterStatus('');
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="card-body">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  marginBottom: 14,
                  alignItems: 'center',
                }}
              >
                <span
                  className="skeleton"
                  style={{ width: 32, height: 32, borderRadius: '50%' }}
                />
                <div style={{ flex: 1 }}>
                  <span
                    className="skeleton"
                    style={{
                      display: 'block',
                      width: '35%',
                      height: 13,
                      marginBottom: 5,
                    }}
                  />
                  <span
                    className="skeleton"
                    style={{ display: 'block', width: '55%', height: 11 }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div className="empty-title">Nenhum usuário encontrado</div>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreate(true)}
              >
                Criar primeiro usuário gestor
              </button>
            </div>
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
              {users.map((u) => {
                const roleStyle = ROLE_COLOR[u.role] || ROLE_COLOR.DPO_EXTERNO;
                const statusInfo = STATUS_BADGE[u.status] || {
                  cls: 'badge-cancelled',
                  label: u.status,
                };
                return (
                  <tr key={u.id}>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: roleStyle.bg,
                            color: roleStyle.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: roleStyle.bg,
                          color: roleStyle.color,
                          fontWeight: 500,
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>
                        {u.company_name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                        {u.tenant_type}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {formatDate(u.last_login_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditUser(u)}
                        >
                          ✏ Editar
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setResetUser(u)}
                        >
                          🔑 Senha
                        </button>
                        {u.role !== 'ROOT' && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={acting === u.id}
                            onClick={() => deleteUser(u)}
                          >
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

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={(u) => {
            setUsers((prev) => [u, ...prev]);
            setTotal((prev) => prev + 1);
            setShowCreate(false);
          }}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={(updated) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u))
            );
            setEditUser(null);
          }}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
        />
      )}
    </RootLayout>
  );
}
