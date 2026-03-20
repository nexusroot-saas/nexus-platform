import { Client } from 'pg';

let clientA;
let clientB;

const TENANT_A = '00000000-0000-0000-0000-00000000000A';
const TENANT_B = '00000000-0000-0000-0000-00000000000B';

beforeAll(async () => {
  clientA = new Client({ connectionString: process.env.DATABASE_URL });
  clientB = new Client({ connectionString: process.env.DATABASE_URL });
  await clientA.connect();
  await clientB.connect();

  // Limpa dados duplicados
  await clientA.query('TRUNCATE TABLE patients, companies RESTART IDENTITY CASCADE;');

  // Cria tenants
  await clientA.query(
    `INSERT INTO companies (id, cnpj, nome_fantasia, tenant_type, status)
     VALUES ($1, '11.111.111/0001-11', 'Tenant A', 'MED', 'ACTIVE')
     ON CONFLICT (cnpj) DO NOTHING;`,
    [TENANT_A]
  );
  await clientA.query(
    `INSERT INTO companies (id, cnpj, nome_fantasia, tenant_type, status)
     VALUES ($1, '22.222.222/0001-22', 'Tenant B', 'MED', 'ACTIVE')
     ON CONFLICT (cnpj) DO NOTHING;`,
    [TENANT_B]
  );

  // Cria pacientes de cada tenant
  await clientA.query(
    `INSERT INTO patients (id, companyid, name, cpf)
     VALUES (gen_random_uuid(), $1, 'Paciente A1', '11111111111'),
            (gen_random_uuid(), $1, 'Paciente A2', '22222222222');`,
    [TENANT_A]
  );
  await clientA.query(
    `INSERT INTO patients (id, companyid, name, cpf)
     VALUES (gen_random_uuid(), $1, 'Paciente B1', '33333333333'),
            (gen_random_uuid(), $1, 'Paciente B2', '44444444444');`,
    [TENANT_B]
  );
});

afterAll(async () => {
  await clientA.end();
  await clientB.end();
});

test('Tenant A deve ver 2 pacientes no seu tenant', async () => {
  const result = await clientA.query('SELECT id FROM patients WHERE companyid = $1;', [TENANT_A]);
  expect(result.rowCount).toBe(2);
});

test('Tenant B deve ver 2 pacientes no seu tenant', async () => {
  const result = await clientB.query('SELECT id FROM patients WHERE companyid = $1;', [TENANT_B]);
  expect(result.rowCount).toBe(2);
});
