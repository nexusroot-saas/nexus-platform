import { Router } from 'express';
import { pool } from '../services/db.service.js';

const router = Router();

// Auth stub para teste
router.use((req, res, next) => {
  req.user = { companyid: '00000000-0000-0000-0000-000000000001' };
  next();
});

router.get('/v1/patients', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('SET app.currentcompanyid = $1', [req.user.companyid]);
    const result = await client.query('SELECT id, fullname, cpf FROM patients');
    res.json({ data: result.rows, count: result.rows.length });
  } finally {
    client.release();
  }
});

export default router;
