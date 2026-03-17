import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/users', authenticate, authorize('users', 'read'), async (req, res) => {
  const { status, role } = req.query;
  const companyId = req.user.company_id;
  try {
    const filters = ['u.company_id = $1', 'u.deleted_at IS NULL'];
    const params = [companyId];
    if (status) {
      params.push(status);
      filters.push(`u.status = $${params.length}`);
    }
    if (role) {
      params.push(role);
      filters.push(`u.role = $${params.length}`);
    }
    const { rows } = await pool.query(
      `SELECT id, name, email, role, status, last_login_at, created_at
       FROM users u WHERE ${filters.join(' AND ')}
       ORDER BY CASE status WHEN 'PENDING' THEN 0 WHEN 'ACTIVE' THEN 1 ELSE 2 END, name ASC`,
      params
    );
    return res.status(200).json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('[manager/users] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

router.post('/users', authenticate, authorize('users', 'create'), async (req, res) => {
  const { name, email, role, password } = req.body;
  const companyId = req.user.company_id;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email e password são obrigatórios.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (id, company_id, name, email, password_hash, role, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'PENDING')
       RETURNING id, name, email, role, status, created_at`,
      [companyId, name, email, hash, role || 'RECEPCIONISTA']
    );
    return res.status(201).json({ data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'E-mail já cadastrado.' });
    return res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

router.patch('/users/:id/approve', authenticate, authorize('users', 'update'), async (req, res) => {
  const { role } = req.body;
  const companyId = req.user.company_id;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE users SET status = 'ACTIVE', role = COALESCE($1, role), updated_at = NOW()
       WHERE id = $2 AND company_id = $3 AND status = 'PENDING'
       RETURNING id, name, email, role, status`,
      [role || null, req.params.id, companyId]
    );
    if (rowCount === 0)
      return res.status(404).json({ error: 'Usuário não encontrado ou já aprovado.' });
    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao aprovar usuário.' });
  }
});

router.patch('/users/:id', authenticate, authorize('users', 'update'), async (req, res) => {
  const { name, role, status } = req.body;
  const companyId = req.user.company_id;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), status = COALESCE($3, status), updated_at = NOW()
       WHERE id = $4 AND company_id = $5 AND deleted_at IS NULL
       RETURNING id, name, email, role, status, updated_at`,
      [name || null, role || null, status || null, req.params.id, companyId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

router.post(
  '/users/:id/reset-password',
  authenticate,
  authorize('users', 'update'),
  async (req, res) => {
    const { new_password } = req.body;
    const companyId = req.user.company_id;
    if (!new_password || new_password.length < 8)
      return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres.' });
    try {
      const hash = await bcrypt.hash(new_password, 10);
      const { rowCount } = await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND company_id = $3 AND deleted_at IS NULL`,
        [hash, req.params.id, companyId]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
      return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
  }
);

router.delete('/users/:id', authenticate, authorize('users', 'delete'), async (req, res) => {
  const companyId = req.user.company_id;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE users SET status = 'BLOCKED', deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL AND role != 'TENANT_ADMIN'
       RETURNING id, name, status`,
      [req.params.id, companyId]
    );
    if (rowCount === 0)
      return res.status(404).json({ error: 'Usuário não encontrado ou é o administrador.' });
    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao desativar usuário.' });
  }
});

router.get('/settings', authenticate, authorize('branding', 'read'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome_fantasia, razao_social, cnpj, tenant_type, active_modules, config_branding, status, created_at
       FROM companies WHERE id = $1`,
      [req.user.company_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Empresa não encontrada.' });
    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
});

router.patch('/settings', authenticate, authorize('branding', 'update'), async (req, res) => {
  const { nome_fantasia, razao_social, config_branding } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE companies SET nome_fantasia = COALESCE($1, nome_fantasia), razao_social = COALESCE($2, razao_social), config_branding = COALESCE($3::jsonb, config_branding), updated_at = NOW()
       WHERE id = $4 RETURNING id, nome_fantasia, razao_social, config_branding, updated_at`,
      [
        nome_fantasia || null,
        razao_social || null,
        config_branding ? JSON.stringify(config_branding) : null,
        req.user.company_id,
      ]
    );
    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar configurações.' });
  }
});

export default router;
