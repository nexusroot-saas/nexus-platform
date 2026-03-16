import { Router } from 'express';
import { login, refresh, logout } from '../services/auth.service.js';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Pública — retorna access_token + refresh_token
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const result = await login(email, password);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json(result);
});

/**
 * POST /api/v1/auth/refresh
 * Pública (com refresh token válido) — emite novo access_token
 */
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token é obrigatório.' });
  }

  const result = await refresh(refresh_token);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json(result);
});

/**
 * POST /api/v1/auth/logout
 * Autenticada — invalida o refresh token
 */
router.post('/logout', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token é obrigatório.' });
  }

  const result = await logout(refresh_token);
  return res.status(200).json({ message: 'Logout realizado.', ...result });
});

export default router;
