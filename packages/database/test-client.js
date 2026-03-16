import pg from 'pg';

const { Pool } = pg;

export function createTestDbClient() {
  return new Pool({
    host: 'localhost',
    port: 5432,
    database: 'nexus_dev',
    user: 'nexus_app', // usuario não-owner — sujeito ao RLS
    password: 'nexus_app_pass',
    ssl: false,
    max: 5,
  });
}

export async function setTenantContext(client, companyId) {
  await client.query(`SET app.current_company_id = '${companyId}'`);
}

export async function clearTenantContext(client) {
  await client.query(`SET app.current_company_id = ''`);
}
