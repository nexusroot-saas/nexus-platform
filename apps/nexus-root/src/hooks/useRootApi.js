import { useCallback } from 'react';
import { useRootAuth } from './useRootAuth.js';

const BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1';

export function useRootApi() {
  const { getToken, logout } = useRootAuth();

  const request = useCallback(async (method, path, body = null) => {
    const token = await getToken();
    if (!token) { await logout(); throw new Error('Sessão expirada.'); }

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) { const e = new Error(data.error || `Erro ${res.status}`); e.status = res.status; throw e; }
    return data;
  }, [getToken, logout]);

  return {
    get:   (path)        => request('GET',    path),
    post:  (path, body)  => request('POST',   path, body),
    patch: (path, body)  => request('PATCH',  path, body),
    del:   (path)        => request('DELETE', path),
  };
}
