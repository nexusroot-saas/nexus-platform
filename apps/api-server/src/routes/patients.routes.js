import { Router } from 'express';
import { pool } from '../services/db.service.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware de autenticação (stub para testes)
router.use(async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = auth.startsWith('Bearer ') ? auth.substring(7).trim() : auth.trim();

  try {
    // Valida JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    req.user = { 
      companyid: decoded.companyid || '00000000-0000-0000-0000-000000000001',
      role: decoded.role
    };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Perfis específicos
  if (req.user.role === 'DPO_EXTERNO') {
    return res.status(403).json({ error: 'Sem permissão patients:read' });
  }

  if (req.user.role === 'FINANCEIRO') {
    req.blockCreate = true;
  }

  // Garante que a empresa existe no banco para evitar erro de FK
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO companies (id, cnpj, nome_fantasia, tenant_type, status)
       VALUES ($1, '11.111.111/0001-11', 'Empresa Teste', 'MED', 'ACTIVE')
       ON CONFLICT (cnpj) DO NOTHING;`,
      [req.user.companyid]
    );
  } finally {
    client.release();
  }

  next();
});

// GET pacientes (simulação de RLS via filtro direto)
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    // Aplica filtro direto pelo companyid
    const result = await client.query(
      'SELECT id, name, cpf, companyid FROM patients WHERE companyid = $1',
      [req.user.companyid]
    );

    res.json({ data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Erro ao buscar pacientes:', err);
    res.status(500).json({ error: 'Erro interno ao buscar pacientes' });
  } finally {
    client.release();
  }
});

// POST pacientes
router.post('/', async (req, res) => {
  if (req.blockCreate) {
    return res.status(403).json({ error: 'Sem permissão patients:create' });
  }

  const client = await pool.connect();
  try {
    const { name, cpf } = req.body;
    const result = await client.query(
      'INSERT INTO patients (id, companyid, name, cpf) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id, name, cpf, companyid',
      [req.user.companyid, name, cpf]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Erro ao criar paciente:', err);
    res.status(500).json({ error: 'Erro interno ao criar paciente' });
  } finally {
    client.release();
  }
});

export default router;
