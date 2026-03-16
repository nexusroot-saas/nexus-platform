import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRootAuth } from '../hooks/useRootAuth.js';

export default function RootLoginPage() {
  const { login } = useRootAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: '#fff',
            margin: '0 auto 12px',
          }}>NR</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>NexusRoot</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Acesso restrito — Administradores da plataforma
          </p>
        </div>

        {/* Form */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24,
        }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email" className="form-input"
                placeholder="root@nexus.app"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Senha</label>
              <input
                type="password" className="form-input"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit" className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {loading ? 'Entrando…' : 'Entrar no painel'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-3)' }}>
          Sessão expira ao fechar o navegador
        </p>
      </div>
    </div>
  );
}
