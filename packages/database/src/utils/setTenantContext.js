// packages/database/src/utils/setTenantContext.js

/**
 * Define o tenant atual no contexto da sessão do cliente.
 * Isso é usado pelo Row Level Security (RLS) para filtrar os dados
 * de acordo com o tenant configurado.
 *
 * @param {import('pg').Client} client - Conexão com o banco de dados
 * @param {string} tenantId - UUID do tenant (companyid)
 */
export async function setTenantContext(client, tenantId) {
  await client.query('SELECT set_config($1, $2, false)', [
    'app.currentcompanyid',
    tenantId,
  ]);
}
