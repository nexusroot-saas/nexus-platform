import { createTestDbClient, setTenantContext } from '../test-client.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';

let pool;
let clientA;
let clientB;

beforeAll(async () => {
  pool = createTestDbClient();
  clientA = await pool.connect();
  clientB = await pool.connect();

  await setTenantContext(clientA, TENANT_A);
  await setTenantContext(clientB, TENANT_B);
});

afterAll(async () => {
  clientA.release();
  clientB.release();
  await pool.end();
});

// ── Testes de isolamento de leitura ──────────────────────────────────────

test('Tenant A NÃO deve ver pacientes do Tenant B (SELECT cross-tenant)', async () => {
  const result = await clientA.query(`SELECT id FROM patients WHERE company_id = $1`, [TENANT_B]);
  expect(result.rowCount).toBe(0);
});

test('Tenant B NÃO deve ver pacientes do Tenant A (SELECT cross-tenant)', async () => {
  const result = await clientB.query(`SELECT id FROM patients WHERE company_id = $1`, [TENANT_A]);
  expect(result.rowCount).toBe(0);
});

test('Tenant A deve ver exatamente 2 pacientes (isolamento de leitura)', async () => {
  const result = await clientA.query(`SELECT id FROM patients`);
  expect(result.rowCount).toBe(2);
});

test('Tenant B deve ver exatamente 2 pacientes (isolamento de leitura)', async () => {
  const result = await clientB.query(`SELECT id FROM patients`);
  expect(result.rowCount).toBe(2);
});

// ── Teste de isolamento de escrita ───────────────────────────────────────

test('Tenant A NÃO deve inserir paciente com company_id do Tenant B (INSERT cross-tenant)', async () => {
  await expect(
    clientA.query(
      `INSERT INTO patients (id, company_id, name)
       VALUES (gen_random_uuid(), $1, 'Intruso')`,
      [TENANT_B]
    )
  ).rejects.toThrow();
});
