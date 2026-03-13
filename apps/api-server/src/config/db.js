import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nexus_dev',
  user: process.env.DB_USER || 'nexus_app',
  password: process.env.DB_PASSWORD || 'nexus_app_pass',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
});

export async function setTenantContext(client, companyId) {
  await client.query(`SET app.current_company_id = '${companyId}'`);
}
