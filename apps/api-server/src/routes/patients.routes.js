import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { pool, withTenantContext } from '../config/db.js';
import { log, auditContextFromReq } from '../services/audit.service.js';

const router = Router();

router.get('/', authenticate, authorize('patients', 'read'), async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await withTenantContext(client, req.user.company_id, (c, companyId) =>
      c.query(
        `SELECT id, name, email, phone, date_of_birth, cpf, status, created_at
         FROM patients
         WHERE company_id = $1
           AND deleted_at IS NULL
         ORDER BY name ASC`,
        [companyId]
      )
    );
    log({ ...auditContextFromReq(req), action: 'VIEW', table_name: 'patients' });
    return res.status(200).json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('[patients] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  } finally {
    client.release();
  }
});

router.post('/', authenticate, authorize('patients', 'create'), async (req, res) => {
  const { name, email, phone, date_of_birth, cpf } = req.body;
  if (!name) return res.status(400).json({ error: 'O campo name é obrigatório.' });

  const client = await pool.connect();
  try {
    const result = await withTenantContext(client, req.user.company_id, (c, companyId) =>
      c.query(
        `INSERT INTO patients (id, company_id, name, email, phone, date_of_birth, cpf, status, created_by)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'ATIVO', $7)
         RETURNING id, name, email, phone, date_of_birth, cpf, status, created_at`,
        [companyId, name, email || null, phone || null, date_of_birth || null, cpf || null, req.user.sub]
      )
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('[patients] POST error:', err.message);
    return res.status(500).json({ error: 'Erro ao criar paciente.' });
  } finally {
    client.release();
  }
});

export default router;
