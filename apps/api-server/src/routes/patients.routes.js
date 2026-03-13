import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { pool, setTenantContext } from '../config/db.js';

const router = Router();

// GET /api/v1/patients — somente roles com 'read' em 'patients'
router.get('/', authenticate, authorize('patients', 'read'), async (req, res) => {
  const client = await pool.connect();
  try {
    await setTenantContext(client, req.user.company_id);
    const result = await client.query(
      `SELECT id, full_name, phone, email, birth_date FROM patients ORDER BY full_name`
    );
    return res.status(200).json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

export default router;
