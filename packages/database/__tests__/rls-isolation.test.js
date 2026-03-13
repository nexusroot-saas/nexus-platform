/**
 * Testes de Isolamento RLS — Secao 12 da Documentacao
 * Valida que nenhum tenant consegue acessar dados de outro tenant.
 * Executar: npm run test:rls
 */

import { createTestDbClient, setTenantContext } from '../test-client.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';
const PATIENT_A1 = '00000000-0000-0000-0000-000000000020';
const PATIENT_B1 = '00000000-0000-0000-0000-000000000040';

describe('RLS — Isolamento Cross-Tenant', () => {
  let pool;
  let client;

  beforeAll(async () => {
    pool = createTestDbClient();
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    // Resetar contexto antes de cada teste
    await client.query(`RESET app.current_company_id`);
  });

  describe('Caso 1 — Cross-Tenant Read (SELECT)', () => {
    it('Tenant A NAO deve ver pacientes do Tenant B', async () => {
      await setTenantContext(client, TENANT_A);
      const result = await client.query(`SELECT id FROM patients WHERE id = $1`, [PATIENT_B1]);
      expect(result.rows).toHaveLength(0);
    });

    it('Tenant B NAO deve ver pacientes do Tenant A', async () => {
      await setTenantContext(client, TENANT_B);
      const result = await client.query(`SELECT id FROM patients WHERE id = $1`, [PATIENT_A1]);
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('Caso 2 — Tenant ve apenas seus proprios dados', () => {
    it('Tenant A deve ver exatamente 2 pacientes', async () => {
      await setTenantContext(client, TENANT_A);
      const result = await client.query(`SELECT id FROM patients`);
      expect(result.rows).toHaveLength(2);
    });

    it('Tenant B deve ver exatamente 2 pacientes', async () => {
      await setTenantContext(client, TENANT_B);
      const result = await client.query(`SELECT id FROM patients`);
      expect(result.rows).toHaveLength(2);
    });
  });

  describe('Caso 3 — Cross-Tenant Write (INSERT)', () => {
    it('Tenant A NAO deve inserir paciente com company_id do Tenant B', async () => {
      await setTenantContext(client, TENANT_A);
      await expect(
        client.query(`INSERT INTO patients (company_id, full_name) VALUES ($1, 'Invasor')`, [
          TENANT_B,
        ])
      ).rejects.toThrow();
    });
  });
});
