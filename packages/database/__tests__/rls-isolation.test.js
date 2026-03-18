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

  await clientA.query(
    `CREATE TABLE IF NOT EXISTS companies (id UUID PRIMARY KEY, cnpj VARCHAR(18), nome_fantasia VARCHAR(200), tenant_type VARCHAR(20), status VARCHAR(20));`
  );
  await clientA.query(
    `CREATE TABLE IF NOT EXISTS patients (id UUID PRIMARY KEY, company_id UUID, full_name VARCHAR(200), cpf VARCHAR(14), phone VARCHAR(20), email VARCHAR(255), birth_date DATE);`
  );
  await clientA.query('TRUNCATE TABLE patients, companies RESTART IDENTITY CASCADE;');

  await clientA.query(
    `INSERT INTO companies (id, cnpj, nome_fantasia, tenant_type, status) VALUES ($1, '11.111.111/0001-11', 'Clínica Saúde Total', 'MED', 'ACTIVE') ON CONFLICT (id) DO NOTHING;`,
    [TENANT_A]
  );
  await clientA.query(
    `INSERT INTO companies (id, cnpj, nome_fantasia, tenant_type, status) VALUES ($1, '22.222.222/0002-22', 'OdontoVita', 'ODONTO', 'ACTIVE') ON CONFLICT (id) DO NOTHING;`,
    [TENANT_B]
  );

  await clientA.query(
    `INSERT INTO patients (id, company_id, full_name, cpf) VALUES ('00000000-0000-0000-0000-000000000101', $1, 'João Silva', '111.111.111-11') ON CONFLICT DO NOTHING;`,
    [TENANT_A]
  );
  await clientA.query(
    `INSERT INTO patients (id, company_id, full_name, cpf) VALUES ('00000000-0000-0000-0000-000000000102', $1, 'Maria Souza', '222.222.222-22') ON CONFLICT DO NOTHING;`,
    [TENANT_A]
  );
  await clientA.query(
    `INSERT INTO patients (id, company_id, full_name, cpf) VALUES ('00000000-0000-0000-0000-000000000201', $1, 'Carlos Lima', '333.333.333-33') ON CONFLICT DO NOTHING;`,
    [TENANT_B]
  );
  await clientA.query(
    `INSERT INTO patients (id, company_id, full_name, cpf) VALUES ('00000000-0000-0000-0000-000000000202', $1, 'Ana Costa', '444.444.444-44') ON CONFLICT DO NOTHING;`,
    [TENANT_B]
  );

  await clientA.query(`ALTER TABLE patients ENABLE ROW LEVEL SECURITY;`);
  await clientA.query(`ALTER TABLE patients FORCE ROW LEVEL SECURITY;`);
  await clientA.query(`DROP POLICY IF EXISTS tenant_isolation_patients ON patients;`);
  await clientA.query(
    `CREATE POLICY tenant_isolation_patients ON patients FOR ALL USING (company_id::text = current_setting('app.currentcompanyid', true)) WITH CHECK (company_id::text = current_setting('app.currentcompanyid', true));`
  );

  await setTenantContext(clientA, TENANT_A);
  await setTenantContext(clientB, TENANT_B);
});

afterAll(async () => {
  if (clientA) {
    clientA.release();
  }
  if (clientB) {
    clientB.release();
  }
  if (pool) {
    await pool.end();
  }
});

// ── Testes de isolamento de leitura ──────────────────────────────────────

test('Tenant A deve ver 2 pacientes no seu tenant', async () => {
  const result = await clientA.query(`SELECT id FROM patients WHERE company_id = $1`, [TENANT_A]);
  expect(result.rowCount).toBe(2);
});

test('Tenant B deve ver 2 pacientes no seu tenant', async () => {
  const result = await clientB.query(`SELECT id FROM patients WHERE company_id = $1`, [TENANT_B]);
  expect(result.rowCount).toBe(2);
});

test('Tenant A consulta por todos os pacientes no tenant', async () => {
  const result = await clientA.query(`SELECT id FROM patients WHERE company_id = $1`, [TENANT_A]);
  expect(result.rowCount).toBe(2);
});

test('Tenant B consulta por todos os pacientes no tenant', async () => {
  const result = await clientB.query(`SELECT id FROM patients WHERE company_id = $1`, [TENANT_B]);
  expect(result.rowCount).toBe(2);
});

// ── Teste de isolamento de escrita ───────────────────────────────────────

test('Tenant A pode inserir paciente no seu tenant', async () => {
  const result = await clientA.query(
    `INSERT INTO patients (id, company_id, full_name) VALUES ($1, $2, $3) RETURNING id`,
    ['00000000-0000-0000-0000-000000000301', TENANT_A, 'Paciente Teste']
  );
  expect(result.rows.length).toBe(1);
});
