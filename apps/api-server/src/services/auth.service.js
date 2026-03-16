import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authPool, pool } from '../config/db.js';

/**
 * Gera o access token JWT com todos os claims necessários para RLS + RBAC
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      company_id: user.company_id,
      role: user.role,
      tenant_type: user.tenant_type,
      modules: user.modules || [],
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

/**
 * login — autentica usuário e retorna access_token + refresh_token
 *
 * ATENÇÃO: usa authPool (owner) para buscar o usuário pelo email,
 * pois ainda não temos company_id para setar o contexto RLS.
 * Após o login, TODAS as operações usam pool (nexus_app) com RLS.
 */
export async function login(email, password) {
  // Busca usuário pelo email usando pool owner (sem RLS)
  const { rows } = await authPool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.status,
            u.company_id, c.tenant_type, c.active_modules
     FROM users u
     JOIN companies c ON c.id = u.company_id
     WHERE u.email = $1
     LIMIT 1`,
    [email]
  );

  if (rows.length === 0) {
    return { error: 'Credenciais inválidas.', status: 401 };
  }

  const user = rows[0];

  if (user.status === 'BLOQUEADO') {
    return { error: 'Usuário bloqueado.', status: 403 };
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    return { error: 'Credenciais inválidas.', status: 401 };
  }

  const accessToken = generateAccessToken({
    id: user.id,
    company_id: user.company_id,
    role: user.role,
    tenant_type: user.tenant_type,
    modules: user.active_modules || [],
  });

  // Grava refresh token no banco (rotação obrigatória — uso único)
  const refreshToken = uuidv4();
  const expiresAt = new Date(
    Date.now() + parseDuration(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d')
  );

  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, company_id, token, expires_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
    [user.id, user.company_id, refreshToken, expiresAt]
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      company_id: user.company_id,
      tenant_type: user.tenant_type,
      modules: user.active_modules || [],
    },
  };
}

/**
 * refresh — valida refresh token e emite novo access token
 */
export async function refresh(refreshToken) {
  const { rows } = await pool.query(
    `SELECT rt.*, u.role, u.company_id, c.tenant_type, c.active_modules
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     JOIN companies c ON c.id = u.company_id
     WHERE rt.token = $1
       AND rt.revoked_at IS NULL
       AND rt.expires_at > NOW()
     LIMIT 1`,
    [refreshToken]
  );

  if (rows.length === 0) {
    return { error: 'Refresh token inválido ou expirado.', status: 401 };
  }

  const rt = rows[0];

  // Revoga o token atual (rotação — uso único)
  await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [rt.id]);

  const newAccessToken = generateAccessToken({
    id: rt.user_id,
    company_id: rt.company_id,
    role: rt.role,
    tenant_type: rt.tenant_type,
    modules: rt.active_modules || [],
  });

  // Emite novo refresh token
  const newRefreshToken = uuidv4();
  const expiresAt = new Date(
    Date.now() + parseDuration(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d')
  );

  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, company_id, token, expires_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
    [rt.user_id, rt.company_id, newRefreshToken, expiresAt]
  );

  return { access_token: newAccessToken, refresh_token: newRefreshToken };
}

/**
 * logout — revoga o refresh token
 */
export async function logout(refreshToken) {
  const result = await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token = $1 AND revoked_at IS NULL`,
    [refreshToken]
  );
  return { revoked: result.rowCount > 0 };
}

// ── Helper ────────────────────────────────────────────────────────────────
function parseDuration(str) {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const [, n, unit] = match;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(n) * units[unit];
}
