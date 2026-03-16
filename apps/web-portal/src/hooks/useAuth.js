import { useState, useCallback } from 'react';

const API = (import.meta.env.VITE_API_URL || '') + '/api/v1';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  // Considera expirado 30s antes para evitar race conditions
  return Date.now() / 1000 >= payload.exp - 30;
}

export function useAuth() {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('nexus_at'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('nexus_rt'));
  const [user, setUser] = useState(() => {
    const at = localStorage.getItem('nexus_at');
    return at ? parseJwt(at) : null;
  });

  const saveTokens = (at, rt) => {
    localStorage.setItem('nexus_at', at);
    localStorage.setItem('nexus_rt', rt);
    setAccessToken(at);
    setRefreshToken(rt);
    setUser(parseJwt(at));
  };

  const clearTokens = () => {
    localStorage.removeItem('nexus_at');
    localStorage.removeItem('nexus_rt');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer login.');
    saveTokens(data.access_token, data.refresh_token);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    if (refreshToken) {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {}); // ignora erro de rede no logout
    }
    clearTokens();
  }, [refreshToken]);

  /**
   * getToken — retorna um access token válido, renovando-o se necessário
   * Use em todos os fetch autenticados: Authorization: Bearer ${await getToken()}
   */
  const getToken = useCallback(async () => {
    if (accessToken && !isTokenExpired(accessToken)) {
      return accessToken;
    }

    if (!refreshToken) {
      clearTokens();
      return null;
    }

    // Tenta renovar
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    saveTokens(data.access_token, data.refresh_token);
    return data.access_token;
  }, [accessToken, refreshToken]);

  return { user, login, logout, getToken };
}
