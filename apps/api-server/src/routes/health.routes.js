import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

/** GET /health/live — servidor respondendo */
router.get('/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

/** GET /health/ready — banco conectado */
router.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

export default router;
