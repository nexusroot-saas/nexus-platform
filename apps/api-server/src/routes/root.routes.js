import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { authPool } from '../config/db.js';

const router = Router();

const ALLOWED_MODULES = [
  'NEXUSMED',
  'NEXUSCLIN',
  'NEXUSODONTO',
  'NEXUSLAB',
  'NEXUSIMG',
  'NEXUSLEGAL',
  'NEXUSADM',
];

/**
 * GET /api/v1/root/tenants
 * Lista todos os tenants da plataforma
 * Role: ROOT apenas
 */
router.get('/tenants', authenticate, authorize('tenants', 'read'), async (_req, res) => {
  try {
    const { rows } = await authPool.query(
      `SELECT c.id, c.cnpj, c.nome_fantasia, c.tenant_type, c.status,
              c.active_modules, c.trial_expires_at, c.created_at,
              COUNT(u.id) AS user_count
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id AND u.deleted_at IS NULL
       WHERE c.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return res.status(200).json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('[root/tenants] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar tenants.' });
  }
});

/**
 * POST /api/v1/root/tenants
 * Provisiona novo tenant
 * Role: ROOT apenas
 */
router.post('/tenants', authenticate, authorize('tenants', 'create'), async (req, res) => {
  const {
    cnpj,
    nome_fantasia,
    razao_social,
    tenant_type,
    active_modules = [],
    trial_days = 30,
  } = req.body;

  if (!nome_fantasia || !tenant_type) {
    return res.status(400).json({ error: 'nome_fantasia e tenant_type são obrigatórios.' });
  }

  const invalidModules = active_modules.filter((m) => !ALLOWED_MODULES.includes(m));
  if (invalidModules.length > 0) {
    return res.status(400).json({ error: `Módulos inválidos: ${invalidModules.join(', ')}` });
  }

  const trialExpiresAt = new Date(Date.now() + trial_days * 24 * 60 * 60 * 1000);

  try {
    const { rows } = await authPool.query(
      `INSERT INTO companies (id, cnpj, nome_fantasia, razao_social, tenant_type, active_modules, status, trial_expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'TRIAL', $6)
       RETURNING id, cnpj, nome_fantasia, tenant_type, status, active_modules, trial_expires_at, created_at`,
      [
        cnpj || null,
        nome_fantasia,
        razao_social || null,
        tenant_type,
        active_modules,
        trialExpiresAt,
      ]
    );
    return res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('[root/tenants] POST error:', err.message);
    return res.status(500).json({ error: 'Erro ao provisionar tenant.' });
  }
});

/**
 * PATCH /api/v1/root/tenants/:id/status
 * Altera status do tenant: ACTIVE | BLOCKED | TRIAL | CANCELLED
 */
router.patch(
  '/tenants/:id/status',
  authenticate,
  authorize('tenants', 'update'),
  async (req, res) => {
    const { status } = req.body;
    const allowed = ['ACTIVE', 'BLOCKED', 'TRIAL', 'CANCELLED'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Use: ${allowed.join(', ')}` });
    }

    try {
      const { rows, rowCount } = await authPool.query(
        `UPDATE companies SET status = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, nome_fantasia, status, updated_at`,
        [status, req.params.id]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Tenant não encontrado.' });
      return res.status(200).json({ data: rows[0] });
    } catch (err) {
      console.error('[root/tenants] PATCH status error:', err.message);
      return res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  }
);

/**
 * PATCH /api/v1/root/tenants/:id/modules
 * Atualiza módulos ativos do tenant (licenciamento)
 */
router.patch(
  '/tenants/:id/modules',
  authenticate,
  authorize('tenants', 'update'),
  async (req, res) => {
    const { active_modules } = req.body;

    if (!Array.isArray(active_modules)) {
      return res.status(400).json({ error: 'active_modules deve ser um array.' });
    }

    const invalid = active_modules.filter((m) => !ALLOWED_MODULES.includes(m));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Módulos inválidos: ${invalid.join(', ')}` });
    }

    try {
      const { rows, rowCount } = await authPool.query(
        `UPDATE companies SET active_modules = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, nome_fantasia, active_modules, updated_at`,
        [active_modules, req.params.id]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Tenant não encontrado.' });
      return res.status(200).json({ data: rows[0] });
    } catch (err) {
      console.error('[root/tenants] PATCH modules error:', err.message);
      return res.status(500).json({ error: 'Erro ao atualizar módulos.' });
    }
  }
);

/**
 * DELETE /api/v1/root/tenants/:id
 * Soft delete do tenant (banimento permanente)
 */
router.delete('/tenants/:id', authenticate, authorize('tenants', 'delete'), async (req, res) => {
  try {
    const { rows, rowCount } = await authPool.query(
      `UPDATE companies SET status = 'CANCELLED', deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, nome_fantasia, status`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Tenant não encontrado.' });
    return res.status(200).json({ data: rows[0], message: 'Tenant cancelado com sucesso.' });
  } catch (err) {
    console.error('[root/tenants] DELETE error:', err.message);
    return res.status(500).json({ error: 'Erro ao cancelar tenant.' });
  }
});

/**
 * GET /api/v1/root/stats
 * Métricas globais da plataforma
 */
router.get('/stats', authenticate, authorize('tenants', 'read'), async (_req, res) => {
  try {
    const { rows } = await authPool.query(
      `SELECT
         COUNT(*)                                          AS total_tenants,
         COUNT(*) FILTER (WHERE status = 'ACTIVE')        AS active_tenants,
         COUNT(*) FILTER (WHERE status = 'TRIAL')         AS trial_tenants,
         COUNT(*) FILTER (WHERE status = 'BLOCKED')       AS blocked_tenants,
         COUNT(*) FILTER (WHERE status = 'CANCELLED')     AS cancelled_tenants,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_last_30d
       FROM companies
       WHERE deleted_at IS NULL`
    );

    const users = await authPool.query(
      `SELECT COUNT(*) AS total_users FROM users WHERE deleted_at IS NULL`
    );

    return res.status(200).json({
      data: {
        ...rows[0],
        total_users: users.rows[0].total_users,
      },
    });
  } catch (err) {
    console.error('[root/stats] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar métricas.' });
  }
});

export default router;
