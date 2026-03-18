import pg from 'pg';

const { Pool } = pg;

export function createTestDbClient() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5,
    });
  }

  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'nexus_dev',
    user: process.env.DB_USER || 'nexus',
    password: process.env.DB_PASSWORD || 'senha',
    ssl: false,
    max: 5,
  });
}

export async function setTenantContext(client, companyId) {
  await client.query(`SET app.currentcompanyid = '${companyId}'`);
}

export async function clearTenantContext(client) {
  await client.query(`SET app.currentcompanyid = ''`);
}
