import { Router } from 'express';
import { login } from '../services/auth.service.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha sao obrigatorios.' });
    }

    const result = await login(email, password);
    return res.status(200).json(result);
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Credenciais invalidas.' });
    }
    if (err.message === 'USER_BLOCKED') {
      return res.status(403).json({ error: 'Usuario bloqueado.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
