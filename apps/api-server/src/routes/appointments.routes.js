import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { pool, withTenantContext } from '../config/db.js';

const router = Router();

/**
 * GET /api/v1/appointments
 * JWT + appointments:read
 * Todos exceto DPO_EXTERNO (controlado pela matriz RBAC)
 */
router.get('/', authenticate, authorize('appointments', 'read'), async (req, res) => {
  const { date, patient_id, professional_id } = req.query;
  const client = await pool.connect();

  try {
    const result = await withTenantContext(client, req.user.company_id, (c) => {
      const filters = ['a.deleted_at IS NULL'];
      const params = [];

      if (date) {
        params.push(date);
        filters.push(`a.scheduled_date::date = $${params.length}`);
      }
      if (patient_id) {
        params.push(patient_id);
        filters.push(`a.patient_id = $${params.length}`);
      }
      if (professional_id) {
        params.push(professional_id);
        filters.push(`a.professional_id = $${params.length}`);
      }

      const where = filters.join(' AND ');

      return c.query(
        `SELECT a.id, a.patient_id, p.name AS patient_name,
                a.professional_id, a.scheduled_date, a.duration_minutes,
                a.status, a.notes, a.created_at
         FROM appointments a
         LEFT JOIN patients p ON p.id = a.patient_id
         WHERE ${where}
         ORDER BY a.scheduled_date ASC`,
        params
      );
    });

    return res.status(200).json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('[appointments] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/v1/appointments
 * JWT + appointments:create
 * Roles: TENANT_ADMIN, RECEPCIONISTA, MEDICO
 */
router.post('/', authenticate, authorize('appointments', 'create'), async (req, res) => {
  const { patient_id, professional_id, scheduled_date, duration_minutes, notes } = req.body;

  if (!patient_id || !scheduled_date) {
    return res.status(400).json({ error: 'patient_id e scheduled_date são obrigatórios.' });
  }

  const client = await pool.connect();

  try {
    const result = await withTenantContext(client, req.user.company_id, (c) =>
      c.query(
        `INSERT INTO appointments
           (id, company_id, patient_id, professional_id, scheduled_date,
            duration_minutes, status, notes, created_by)
         VALUES
           (gen_random_uuid(), $1, $2, $3, $4, $5, 'AGENDADO', $6, $7)
         RETURNING id, patient_id, professional_id, scheduled_date,
                   duration_minutes, status, notes, created_at`,
        [
          req.user.company_id,
          patient_id,
          professional_id || null,
          scheduled_date,
          duration_minutes || 30,
          notes || null,
          req.user.sub,
        ]
      )
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('[appointments] POST error:', err.message);
    return res.status(500).json({ error: 'Erro ao criar agendamento.' });
  } finally {
    client.release();
  }
});

export default router;
