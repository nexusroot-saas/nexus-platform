import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;

const loginPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'nexus_dev',
  user: 'nexus',
  password: 'nexus_dev_pass',
  ssl: false,
  max: 5,
});

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-dev-secret-minimo-32-chars-aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export async function login(email, password) {
  const client = await loginPool.connect();
  try {
    console.log('[auth] buscando usuario:', email);
    const result = await client.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.status,
              u.company_id, c.tenant_type
       FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email]
    );
    console.log('[auth] usuarios encontrados:', result.rows.length);

    if (result.rows.length === 0) throw new Error('INVALID_CREDENTIALS');

    const user = result.rows[0];
    if (user.status !== 'ACTIVE') throw new Error('USER_BLOCKED');

    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('[auth] senha valida:', validPassword);
    if (!validPassword) throw new Error('INVALID_CREDENTIALS');

    const accessToken = jwt.sign(
      {
        sub: user.id,
        company_id: user.company_id,
        role: user.role,
        tenant_type: user.tenant_type,
        modules: [`NEXUS${user.tenant_type}`],
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = crypto.randomUUID();
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, refreshHash, expiresAt]
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role,
        company_id: user.company_id,
        tenant_type: user.tenant_type,
        modules: [`NEXUS${user.tenant_type}`],
      },
    };
  } catch (err) {
    console.error('[auth] erro:', err.message);
    throw err;
  } finally {
    client.release();
  }
}
