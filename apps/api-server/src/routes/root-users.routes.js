import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { authPool } from '../config/db.js';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * GET /api/v1/root/users
 * Lista todos os usuários da plataforma com dados do tenant
 * Role: ROOT apenas
 */
router.get('/', authenticate, authorize('users', 'read'), async (req, res) => {
  const { company_id, role, status, search, page = 1, limit = 50 } = req.query;
  const safeLimit = Math.min(Number(limit), 200);
  const offset = (Number(page) - 1) * safeLimit;

  try {
    const filters = ['u.deleted_at IS NULL'];
    const params = [];

    if (company_id) {
      params.push(company_id);
      filters.push(`u.company_id = $${params.length}`);
    }
    if (role) {
      params.push(role);
      filters.push(`u.role = $${params.length}`);
    }
    if (status) {
      params.push(status);
      filters.push(`u.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      filters.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const where = filters.join(' AND ');
    params.push(safeLimit, offset);

    const { rows } = await authPool.query(
      `SELECT u.id, u.name, u.email, u.role, u.status,
              u.company_id, c.nome_fantasia AS company_name,
              c.tenant_type, u.last_login_at, u.created_at
       FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Total sem paginação
    const countParams = params.slice(0, -2);
    const { rows: countRows } = await authPool.query(
      `SELECT COUNT(*) FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE ${where}`,
      countParams
    );

    return res.status(200).json({
      data: rows,
      total: Number(countRows[0].count),
    });
  } catch (err) {
    console.error('[root/users] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

/**
 * GET /api/v1/root/users/:id
 * Detalhe de um usuário específico
 */
router.get('/:id', authenticate, authorize('users', 'read'), async (req, res) => {
  try {
    const { rows } = await authPool.query(
      `SELECT u.id, u.name, u.email, u.role, u.status,
              u.company_id, c.nome_fantasia AS company_name,
              c.tenant_type, c.active_modules,
              u.last_login_at, u.created_at, u.updated_at
       FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('[root/users] GET/:id error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

/**
 * PATCH /api/v1/root/users/:id/status
 * Ativa, bloqueia ou coloca usuário como pendente
 */
router.patch('/:id/status', authenticate, authorize('users', 'update'), async (req, res) => {
  const { status } = req.body;
  const allowed = ['ACTIVE', 'BLOCKED', 'PENDING'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${allowed.join(', ')}` });
  }

  try {
    const { rows, rowCount } = await authPool.query(
      `UPDATE users SET status = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, email, role, status, updated_at`,
      [status, req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('[root/users] PATCH status error:', err.message);
    return res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

/**
 * PATCH /api/v1/root/users/:id/role
 * Altera o role de um usuário
 */
router.patch('/:id/role', authenticate, authorize('users', 'update'), async (req, res) => {
  const { role } = req.body;
  const allowed = ['ROOT', 'TENANT_ADMIN', 'MEDICO', 'RECEPCIONISTA', 'FINANCEIRO', 'DPO_EXTERNO'];

  if (!allowed.includes(role)) {
    return res.status(400).json({ error: `Role inválido. Use: ${allowed.join(', ')}` });
  }

  try {
    const { rows, rowCount } = await authPool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, email, role, status, updated_at`,
      [role, req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('[root/users] PATCH role error:', err.message);
    return res.status(500).json({ error: 'Erro ao atualizar role.' });
  }
});

/**
 * POST /api/v1/root/users/:id/reset-password
 * Reset de senha de emergência pelo ROOT
 */
router.post('/:id/reset-password', authenticate, authorize('users', 'update'), async (req, res) => {
  const { new_password } = req.body;

  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres.' });
  }

  try {
    const hash = await bcrypt.hash(new_password, 10);

    const { rowCount } = await authPool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL`,
      [hash, req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    console.error('[root/users] reset-password error:', err.message);
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
});

/**
 * DELETE /api/v1/root/users/:id
 * Soft delete de usuário (desligamento)
 */
router.delete('/:id', authenticate, authorize('users', 'delete'), async (req, res) => {
  try {
    const { rows, rowCount } = await authPool.query(
      `UPDATE users
       SET status = 'BLOCKED', deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name, email, status`,
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ data: rows[0], message: 'Usuário removido com sucesso.' });
  } catch (err) {
    console.error('[root/users] DELETE error:', err.message);
    return res.status(500).json({ error: 'Erro ao remover usuário.' });
  }
});

export default router;
