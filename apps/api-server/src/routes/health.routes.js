import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error('[health/ready] DB error:', err.message);
    res
      .status(503)
      .json({ status: 'error', db: 'disconnected', detail: err.message });
  }
});

export default router;
