import pg from 'pg';

const { Pool } = pg;

const sslConfig = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;

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

// Tenta setar o contexto RLS — funciona em conexão direta e session pooler
// Em transaction pooler, o filtro explícito por company_id nas queries é o fallback
export async function withTenantContext(client, companyId, fn) {
  try {
    await client.query(`SET LOCAL app.currentcompanyid = '${companyId}'`);
  } catch {
    // Transaction pooler não suporta SET LOCAL — ignora, usa filtro explícito
  }
  return fn(client, companyId);
}

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool principal:', err.message);
});
