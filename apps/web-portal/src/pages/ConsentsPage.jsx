import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';

const STATUS_BADGE = {
  PENDENTE: 'badge-warning',
  ASSINADO: 'badge-success',
  RECUSADO: 'badge-danger',
  EXPIRADO: 'badge-neutral',
  REVOGADO: 'badge-danger',
};

const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  ASSINADO: 'Assinado',
  RECUSADO: 'Recusado',
  EXPIRADO: 'Expirado',
  REVOGADO: 'Revogado',
};

const CHANNEL_ICON = {
  WHATSAPP: '💬',
  EMAIL: '✉️',
  TABLET: '📱',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Modal enviar consentimento ────────────────────────────────────────
function SendConsentModal({ onClose, onSent }) {
  const { post } = useApi();
  const [patientId, setPatientId] = useState('');
  const [channel, setChannel] = useState('WHATSAPP');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const res = await post('/consents/send', {
        patient_id: patientId.trim(),
        channel,
        term_version: '1.0',
      });
      onSent(res.data);
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
          <span className="modal-title">Enviar Termo de Consentimento</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
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
              <label className="form-label">ID do Paciente *</label>
              <input
                className="form-input"
                placeholder="uuid do paciente"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              />
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                Cole o ID do paciente da listagem de pacientes.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Canal de envio</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {['WHATSAPP', 'EMAIL', 'TABLET'].map((ch) => (
                  <label
                    key={ch}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${channel === ch ? 'var(--accent)' : 'var(--border)'}`,
                      background:
                        channel === ch
                          ? 'var(--accent-soft)'
                          : 'var(--surface)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: 13,
                      color: channel === ch ? 'var(--accent)' : 'var(--text-2)',
                      transition: 'all .15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={ch}
                      checked={channel === ch}
                      onChange={() => setChannel(ch)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: 18, marginBottom: 2 }}>
                      {CHANNEL_ICON[ch]}
                    </div>
                    <div style={{ fontWeight: channel === ch ? 500 : 400 }}>
                      {ch}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enviando…' : 'Enviar Termo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────
export default function ConsentsPage() {
  const { user } = useAuth();
  const { get, post } = useApi();

  const [consents, setConsents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [revoking, setRevoking] = useState(null);

  const canCreate = ['TENANT_ADMIN', 'RECEPCIONISTA'].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await get(`/consents${params}`);
      setConsents(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSent(consent) {
    setConsents((prev) => [consent, ...prev]);
    setTotal((prev) => prev + 1);
    setShowModal(false);
  }

  async function handleRevoke(id) {
    if (!confirm('Confirmar revogação deste consentimento?')) return;
    setRevoking(id);
    try {
      await post(`/consents/${id}/revoke`);
      setConsents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'REVOGADO' } : c))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setRevoking(null);
    }
  }

  return (
    <AppLayout title="Consentimentos LGPD">
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
            style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}
          >
            Consentimentos
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            {total} registros
          </p>
        </div>
        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Enviar Termo
          </button>
        )}
      </div>

      {/* Filtro por status */}
      <div
        style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
      >
        {['', 'PENDENTE', 'ASSINADO', 'RECUSADO', 'EXPIRADO', 'REVOGADO'].map(
          (s) => (
            <button
              key={s}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(s)}
            >
              {s || 'Todos'}
            </button>
          )
        )}
      </div>

      <div className="card">
        {error && (
          <div className="card-body">
            <div className="alert alert-danger">⚠ {error}</div>
          </div>
        )}

        {!error && loading && (
          <div className="card-body">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 12, marginBottom: 12 }}
              >
                <span
                  className="skeleton"
                  style={{ width: '30%', height: 16, borderRadius: 4 }}
                />
                <span
                  className="skeleton"
                  style={{ width: '20%', height: 16, borderRadius: 4 }}
                />
                <span
                  className="skeleton"
                  style={{ width: '15%', height: 16, borderRadius: 4 }}
                />
              </div>
            ))}
          </div>
        )}

        {!error && !loading && consents.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <div className="empty-state-title">
              Nenhum consentimento encontrado
            </div>
            <div className="empty-state-desc">
              {canCreate
                ? 'Envie o termo para um paciente para começar.'
                : 'Nenhum registro disponível.'}
            </div>
          </div>
        )}

        {!error && !loading && consents.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Versão</th>
                <th>Canal</th>
                <th>Status</th>
                <th>Assinado em</th>
                <th>Criado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {consents.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>
                    {c.patient_name || c.patient_id.slice(0, 8) + '…'}
                  </td>
                  <td
                    style={{
                      fontFamily: 'DM Mono',
                      fontSize: 12,
                      color: 'var(--text-3)',
                    }}
                  >
                    v{c.term_version}
                  </td>
                  <td>
                    {CHANNEL_ICON[c.channel]} {c.channel}
                  </td>
                  <td>
                    <span
                      className={`badge ${STATUS_BADGE[c.status] || 'badge-neutral'}`}
                    >
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {formatDate(c.signed_at)}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {formatDate(c.created_at)}
                  </td>
                  <td>
                    {c.status === 'ASSINADO' && canCreate && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRevoke(c.id)}
                        disabled={revoking === c.id}
                      >
                        {revoking === c.id ? '…' : 'Revogar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <SendConsentModal
          onClose={() => setShowModal(false)}
          onSent={handleSent}
        />
      )}
    </AppLayout>
  );
}
