import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { pool, withTenantContext } from '../config/db.js';

const router = Router();

/**
 * GET /api/v1/patients
 * JWT + patients:read
 * Retorna pacientes do tenant autenticado (RLS filtra automaticamente)
 */
router.get('/', authenticate, authorize('patients', 'read'), async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await withTenantContext(client, req.user.company_id, (c) =>
      c.query(
        `SELECT id, name, email, phone, date_of_birth, cpf, status, created_at
         FROM patients
         WHERE deleted_at IS NULL
         ORDER BY name ASC`
      )
    );

    return res.status(200).json({
      data: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    console.error('[patients] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/v1/patients
 * JWT + patients:create
 * Roles: TENANT_ADMIN, RECEPCIONISTA
 */
router.post('/', authenticate, authorize('patients', 'create'), async (req, res) => {
  const { name, email, phone, date_of_birth, cpf } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O campo name é obrigatório.' });
  }

  const client = await pool.connect();

  try {
    const result = await withTenantContext(client, req.user.company_id, (c) =>
      c.query(
        `INSERT INTO patients (id, company_id, name, email, phone, date_of_birth, cpf, status, created_by)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'ATIVO', $7)
         RETURNING id, name, email, phone, date_of_birth, cpf, status, created_at`,
        [req.user.company_id, name, email || null, phone || null, date_of_birth || null, cpf || null, req.user.sub]
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
