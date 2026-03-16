import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { requireModule } from '../middlewares/module.middleware.js';
import { pool, withTenantContext } from '../config/db.js';
import { createConsent, sendConsent } from '../services/consent.service.js';

const router = Router();

/**
 * GET /api/v1/consents
 * JWT + consents:read
 * Roles: TENANT_ADMIN, MEDICO, RECEPCIONISTA, DPO_EXTERNO
 * Requer módulo: NEXUSLEGAL
 */
router.get(
  '/',
  authenticate,
  requireModule('NEXUSLEGAL'),
  authorize('consents', 'read'),
  async (req, res) => {
    const { patient_id, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const client = await pool.connect();

    try {
      const result = await withTenantContext(client, req.user.company_id, (c) => {
        const filters = [];
        const params = [];

        if (patient_id) {
          params.push(patient_id);
          filters.push(`c.patient_id = $${params.length}`);
        }
        if (status) {
          params.push(status);
          filters.push(`c.status = $${params.length}`);
        }

        const where = filters.length ? `AND ${filters.join(' AND ')}` : '';
        params.push(Number(limit), offset);

        return c.query(
          `SELECT c.id, c.patient_id, p.name AS patient_name,
                  c.term_version, c.channel, c.status,
                  c.signed_at, c.expires_at, c.created_at
           FROM consents c
           LEFT JOIN patients p ON p.id = c.patient_id
           WHERE 1=1 ${where}
           ORDER BY c.created_at DESC
           LIMIT $${params.length - 1} OFFSET $${params.length}`,
          params
        );
      });

      return res.status(200).json({ data: result.rows, total: result.rowCount });
    } catch (err) {
      console.error('[consents] GET error:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar consentimentos.' });
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/v1/consents/:id
 * Consulta status de um consentimento específico (usado por integrações)
 */
router.get(
  '/:id',
  authenticate,
  requireModule('NEXUSLEGAL'),
  authorize('consents', 'read'),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const result = await withTenantContext(client, req.user.company_id, (c) =>
        c.query(
          `SELECT id, patient_id, term_version, channel, status,
                  ip_address, signed_at, expires_at, revoked_at, created_at
           FROM consents
           WHERE id = $1`,
          [req.params.id]
        )
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Consentimento não encontrado.' });
      }

      return res.status(200).json({ data: result.rows[0] });
    } catch (err) {
      console.error('[consents] GET/:id error:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar consentimento.' });
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/v1/consents/send
 * JWT + consents:create
 * Roles: TENANT_ADMIN, RECEPCIONISTA
 * Cria um consentimento e aciona envio via WhatsApp/e-mail
 */
router.post(
  '/send',
  authenticate,
  requireModule('NEXUSLEGAL'),
  authorize('consents', 'create'),
  async (req, res) => {
    const { patient_id, channel = 'WHATSAPP', term_version = '1.0' } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id é obrigatório.' });
    }

    if (!['WHATSAPP', 'EMAIL', 'TABLET'].includes(channel)) {
      return res.status(400).json({ error: 'channel deve ser WHATSAPP, EMAIL ou TABLET.' });
    }

    try {
      const result = await createConsent({
        company_id: req.user.company_id,
        patient_id,
        channel,
        term_version,
        created_by: req.user.sub,
        ip_address: req.ip,
      });

      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }

      // Dispara envio assíncrono (não bloqueia a resposta)
      sendConsent(result.consent).catch((err) =>
        console.error('[consents] sendConsent error:', err.message)
      );

      return res.status(201).json({
        data: result.consent,
        message: `Termo enviado via ${channel}.`,
      });
    } catch (err) {
      console.error('[consents] POST /send error:', err.message);
      return res.status(500).json({ error: 'Erro ao enviar consentimento.' });
    }
  }
);

/**
 * POST /api/v1/consents/:id/revoke
 * Revoga um consentimento (exercício de direito do titular — Art. 18 LGPD)
 */
router.post(
  '/:id/revoke',
  authenticate,
  requireModule('NEXUSLEGAL'),
  authorize('consents', 'update'),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const result = await withTenantContext(client, req.user.company_id, (c) =>
        c.query(
          `UPDATE consents
           SET status = 'REVOGADO', revoked_at = NOW()
           WHERE id = $1
             AND status NOT IN ('REVOGADO', 'EXPIRADO')
           RETURNING id, status, revoked_at`,
          [req.params.id]
        )
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Consentimento não encontrado ou já revogado.' });
      }

      return res.status(200).json({ data: result.rows[0] });
    } catch (err) {
      console.error('[consents] POST /:id/revoke error:', err.message);
      return res.status(500).json({ error: 'Erro ao revogar consentimento.' });
    } finally {
      client.release();
    }
  }
);

export default router;
