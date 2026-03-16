import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import '../styles/login.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Painel esquerdo — decorativo */}
      <div className="login-left" aria-hidden="true">
        <div className="login-left-content">
          <div className="login-brand-icon">N</div>
          <h1 className="login-brand-name">Nexus</h1>
          <p className="login-brand-tagline">
            Gestão em Saúde &amp;<br/>Compliance integrados.
          </p>
          <div className="login-modules">
            {['ERP', 'EHR', 'LGPD'].map(m => (
              <span key={m} className="login-module-pill">{m}</span>
            ))}
          </div>
        </div>
        <div className="login-left-bg" />
      </div>

      {/* Painel direito — formulário */}
      <div className="login-right">
        <div className="login-form-wrap animate-fade-up">
          <div className="login-form-header">
            <h2 className="login-form-title">Bem-vindo de volta</h2>
            <p className="login-form-sub">Entre com suas credenciais para acessar a plataforma.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="alert alert-danger" role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Atalho de teste em dev */}
          {import.meta.env.DEV && (
            <div className="login-dev-hint">
              <strong>Dev seeds:</strong>{' '}
              <button
                type="button"
                className="login-dev-btn"
                onClick={() => { setEmail('admin@saudetotal.com'); setPassword('senha123'); }}
              >
                Saúde Total (MED)
              </button>
              <button
                type="button"
                className="login-dev-btn"
                onClick={() => { setEmail('admin@odontovita.com'); setPassword('senha123'); }}
              >
                OdontoVita
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
