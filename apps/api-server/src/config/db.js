import pg from 'pg';

const { Pool } = pg;

const sslConfig = process.env.NODE_ENV === 'production'
  ? { rejectUnauthorized: false }
  : false;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const authPool = new Pool({
  connectionString: process.env.DATABASE_URL_OWNER || process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 5,
  idleTimeoutMillis: 10000,
});

export async function withTenantContext(client, companyId, fn) {
  await client.query(`SET app.current_company_id = '${companyId}'`);
  return fn(client);
}

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool principal:', err.message);
});
