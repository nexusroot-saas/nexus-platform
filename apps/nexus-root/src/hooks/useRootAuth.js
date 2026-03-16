import { useState, useCallback } from 'react';

const API = (import.meta.env.VITE_API_URL || '') + '/api/v1';

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

function isExpired(token) {
  const p = parseJwt(token);
  return !p?.exp || Date.now() / 1000 >= p.exp - 30;
}

export function useRootAuth() {
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem('root_at'));
  const [refreshToken, setRefreshToken] = useState(() => sessionStorage.getItem('root_rt'));
  const [user, setUser] = useState(() => {
    const at = sessionStorage.getItem('root_at');
    return at ? parseJwt(at) : null;
  });
  const [error, setError] = useState('');

  // NexusRoot usa sessionStorage (não localStorage) por segurança — sessão expira ao fechar o browser
  const save = (at, rt) => {
    sessionStorage.setItem('root_at', at);
    sessionStorage.setItem('root_rt', rt);
    setAccessToken(at); setRefreshToken(rt); setUser(parseJwt(at));
  };

  const clear = () => {
    sessionStorage.removeItem('root_at');
    sessionStorage.removeItem('root_rt');
    setAccessToken(null); setRefreshToken(null); setUser(null);
  };

  const login = useCallback(async (email, password) => {
    setError('');
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer login.');

    // Garante que apenas ROOT pode acessar este painel
    const payload = parseJwt(data.access_token);
    if (payload?.role !== 'ROOT') {
      throw new Error('Acesso restrito. Este painel é exclusivo para administradores da plataforma.');
    }

    save(data.access_token, data.refresh_token);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    if (refreshToken) {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    clear();
  }, [refreshToken]);

  const getToken = useCallback(async () => {
    if (accessToken && !isExpired(accessToken)) return accessToken;
    if (!refreshToken) { clear(); return null; }

    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) { clear(); return null; }

    const data = await res.json();
    save(data.access_token, data.refresh_token);
    return data.access_token;
  }, [accessToken, refreshToken]);

  return { user, login, logout, getToken, error, setError };
}
