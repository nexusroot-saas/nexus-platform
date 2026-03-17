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
router.get('/', authenticate, authorize('patients', 'read'), async (req, res) => {
  const client = await pool.connect();

  try {
    // ✅ SET contexto tenant ANTES de qualquer query
    await client.query('SET app.currentcompanyid = $1', [req.user.companyid]);

    // ✅ RLS filtra AUTOMATICAMENTE por companyid
    const result = await client.query(`
        SELECT 
          id, name, cpf, email, phone, 
          birthdate, createdat, updatedat
        FROM patients 
        ORDER BY name ASC
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});

// GET /api/v1/patients/:id - Paciente específico
router.get('/:id', authenticate, authorize('patients', 'read'), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('SET app.currentcompanyid = $1', [req.user.companyid]);

    const result = await client.query(
      'SELECT id, name, cpf, email, phone, birthdate, createdat, updatedat FROM patients WHERE id = $1',
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
});

export default router;
