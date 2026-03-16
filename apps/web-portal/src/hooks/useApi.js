import { useCallback } from 'react';
import { useAuth } from './useAuth.js';

const BASE = '/api/v1';

/**
 * useApi — hook para todas as chamadas autenticadas à API
 *
 * Injeta automaticamente o Bearer token (renovando via refresh se necessário)
 * e serializa o body como JSON.
 *
 * Uso:
 *   const { get, post } = useApi();
 *   const { data, total } = await get('/patients');
 *   const patient = await post('/patients', { name: 'João' });
 */
export function useApi() {
  const { getToken, logout } = useAuth();

  const request = useCallback(
    async (method, path, body = null, options = {}) => {
      const token = await getToken();

      if (!token) {
        // Token inválido/expirado e sem refresh — força logout
        await logout();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };

      const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: options.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        const err = new Error(data.error || `Erro ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    },
    [getToken, logout]
  );

  return {
    get: (path, opts) => request('GET', path, null, opts),
    post: (path, body, opts) => request('POST', path, body, opts),
    put: (path, body, opts) => request('PUT', path, body, opts),
    patch: (path, body, opts) => request('PATCH', path, body, opts),
    delete: (path, opts) => request('DELETE', path, null, opts),
  };
}
