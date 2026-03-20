// apps/api-server/src/routes/patients.routes.js
// ✅ RLS + Auth + RBAC + Audit Completo - Nexus Platform
// SEM JWT Dashboard - Usa current_setting('app.currentcompanyid')

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { pool } from '../config/db.js';
import { auditContextFromReq, log } from '../services/audit.service.js';

const router = Router();

// GET /api/v1/patients - Lista pacientes do tenant (RLS filtra!)
router.get(
  '/',
  authenticate,
  authorize('patients', 'read'),
  async (req, res) => {
    const client = await pool.connect();

    try {
      // ✅ SET contexto tenant ANTES de qualquer query
      await client.query('SET app.currentcompanyid = $1', [req.user.companyid]);

      // ✅ RLS filtra AUTOMATICAMENTE por companyid
      const result = await client.query(`
        SELECT 
          id, full_name AS name, cpf, email, phone, 
          birthdate, createdat, updatedat
        FROM patients 
        ORDER BY full_name ASC
      `);

      // ✅ Log de auditoria
      await log(
        {
          ...auditContextFromReq(req),
          action: 'VIEW',
          tablename: 'patients',
          recordcount: result.rows.length,
        },
        client
      );

      res.status(200).json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        message: `${result.rows.length} pacientes encontrados`,
      });
    } catch (error) {
      console.error('Patients list error:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao listar pacientes',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    } finally {
      client.release();
    }
  }
);

// POST /api/v1/patients - Cria paciente (tenant isolado)
router.post(
  '/',
  authenticate,
  authorize('patients', 'create'),
  async (req, res) => {
    const { name, cpf, email, phone, birthdate } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'O campo name é obrigatório.' });
    }

    const client = await pool.connect();
    try {
      await client.query('SET app.currentcompanyid = $1', [req.user.companyid]);
      const result = await client.query(
        `INSERT INTO patients (id, company_id, full_name, cpf, email, phone, birth_date)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       RETURNING id, full_name AS name, cpf, email, phone, birth_date AS birthdate, created_at AS createdat, updated_at AS updatedat`,
        [
          req.user.companyid,
          name.trim(),
          cpf || null,
          email || null,
          phone || null,
          birthdate || null,
        ]
      );

      await log(
        {
          ...auditContextFromReq(req),
          action: 'CREATE',
          tablename: 'patients',
          recordid: result.rows[0].id,
        },
        client
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Patient create error:', error);
      return res.status(500).json({ error: 'Erro ao criar paciente.' });
    } finally {
      client.release();
    }
  }
);

// GET /api/v1/patients/:id - Paciente específico
router.get(
  '/:id',
  authenticate,
  authorize('patients', 'read'),
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query('SET app.currentcompanyid = $1', [req.user.companyid]);

      const result = await client.query(
        'SELECT id, full_name AS name, cpf, email, phone, birth_date AS birthdate, created_at AS createdat, updated_at AS updatedat FROM patients WHERE id = $1',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Paciente não encontrado',
        });
      }

      await log(
        {
          ...auditContextFromReq(req),
          action: 'VIEW',
          tablename: 'patients',
          recordid: req.params.id,
        },
        client
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Patient get error:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar paciente',
      });
    } finally {
      client.release();
    }
  }
);

export default router;
