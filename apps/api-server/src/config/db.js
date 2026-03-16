import pg from 'pg';

const { Pool } = pg;

// ── Pool principal — usuario nexus_app (NÃO owner, sujeito ao RLS) ────────
// Usado em TODAS as queries após autenticação.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ── Pool de auth — usuario nexus (owner) APENAS para login ───────────────
// O owner bypassa RLS. Necessário somente para buscar usuário pelo email
// antes de conhecer o company_id. Não usar em nenhuma outra operação.
export const authPool = new Pool({
  connectionString: process.env.DATABASE_URL_OWNER || process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
});

// ── Helper: seta contexto RLS antes de qualquer query de tenant ───────────
export async function withTenantContext(client, companyId, fn) {
  await client.query(`SET app.current_company_id = '${companyId}'`);
  return fn(client);
}

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool principal:', err.message);
});
