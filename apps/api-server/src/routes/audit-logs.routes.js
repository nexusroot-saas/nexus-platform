import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { pool } from '../config/db.js';

const router = Router();

router.get('/', authenticate, authorize('audit_logs', 'read'), async (req, res) => {
  const { user_id, table_name, action, from, to, page = 1, limit = 50 } = req.query;
  const companyId = req.user.company_id;
  const safeLimit = Math.min(Number(limit), 200);
  const offset = (Number(page) - 1) * safeLimit;
  const client = await pool.connect();
  try {
    const filters = ['al.company_id = $1'];
    const params = [companyId];
    if (user_id) {
      params.push(user_id);
      filters.push(`al.user_id = $${params.length}`);
    }
    if (table_name) {
      params.push(table_name);
      filters.push(`al.table_name = $${params.length}`);
    }
    if (action) {
      params.push(action.toUpperCase());
      filters.push(`al.action = $${params.length}`);
    }
    if (from) {
      params.push(from);
      filters.push(`al.created_at >= $${params.length}::timestamptz`);
    }
    if (to) {
      params.push(to);
      filters.push(`al.created_at <= $${params.length}::timestamptz`);
    }
    params.push(safeLimit, offset);
    const result = await client.query(
      `SELECT al.id, al.user_id, u.name AS user_name,
              al.action, al.table_name, al.record_id,
              al.ip_address, al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id AND u.company_id = $1
       WHERE ${filters.join(' AND ')}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return res.status(200).json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('[audit-logs] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar logs de auditoria.' });
  } finally {
    client.release();
  }
});

router.get('/:record_id', authenticate, authorize('audit_logs', 'read'), async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, user_id, action, table_name, old_values, new_values, ip_address, user_agent, created_at
       FROM audit_logs
       WHERE record_id = $1 AND company_id = $2
       ORDER BY created_at ASC`,
      [req.params.record_id, req.user.company_id]
    );
    return res.status(200).json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('[audit-logs] GET/:record_id error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar histórico.' });
  } finally {
    client.release();
  }
});

export default router;
