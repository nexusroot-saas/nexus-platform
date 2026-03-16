import { pool } from '../config/db.js';

/**
 * log — grava evento de auditoria de forma não-bloqueante
 *
 * Chamado em handlers que acessam dados sensíveis (prontuários, financeiro, etc.)
 * Os logs são imutáveis: apenas INSERT, nunca UPDATE ou DELETE (LGPD Art. 37).
 *
 * @param {object} opts
 * @param {string} opts.company_id
 * @param {string} opts.user_id
 * @param {string} opts.action    — INSERT | UPDATE | DELETE | VIEW
 * @param {string} opts.table_name
 * @param {string} [opts.record_id]
 * @param {object} [opts.old_values]
 * @param {object} [opts.new_values]
 * @param {string} [opts.ip_address]
 * @param {string} [opts.user_agent]
 */
export async function log({
  company_id,
  user_id,
  action,
  table_name,
  record_id = null,
  old_values = null,
  new_values = null,
  ip_address = null,
  user_agent = null,
}) {
  // Fire-and-forget: não bloqueia a resposta HTTP
  pool
    .query(
      `INSERT INTO audit_logs
         (id, company_id, user_id, action, table_name, record_id,
          old_values, new_values, ip_address, user_agent)
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        company_id,
        user_id,
        action,
        table_name,
        record_id,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address,
        user_agent,
      ]
    )
    .catch((err) => console.error('[audit_log] Falha ao gravar log:', err.message));
}

/**
 * Helper: extrai informações de contexto da requisição Express
 */
export function auditContextFromReq(req) {
  return {
    company_id: req.user.company_id,
    user_id: req.user.sub,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] || null,
  };
}
