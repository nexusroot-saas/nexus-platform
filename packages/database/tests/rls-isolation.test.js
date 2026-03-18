// FIX: Pool CI + Docker Test DB
import { Pool } from 'pg';

let pool;
let clientA, clientB;

// ✅ CI: Docker Postgres + nexusapp
const createTestDbClient = () => {
  return new Pool({
    user: process.env.DB_USER || 'nexusapp',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'nexus_test',
    password: process.env.DB_PASSWORD || 'test123',
    port: process.env.DB_PORT || 5433,  // Docker port
    max: 5
  });
};

beforeAll(async () => {
  pool = createTestDbClient();
  
  // ✅ Teste conexão
  clientA = await pool.connect();
  clientB = await pool.connect();
  
  // ✅ Seed tenants
  await clientA.query(`
    INSERT INTO companies (id, name, cnpj) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Tenant A'),
    ('22222222-2222-2222-2222-222222222222', 'Tenant B')
    ON CONFLICT (id) DO NOTHING
  `);
  
  console.log('✅ Seed OK - Testes RLS iniciando');
}, 30000);

test('Tenant A deve ver 2 pacientes no seu tenant', async () => {
  // ✅ Inserir pacientes Tenant A
  await clientA.query('SET app.currentcompanyid = $1', ['11111111-1111-1111-1111-111111111111']);
  await clientA.query(`
    INSERT INTO patients (id, companyid, name, cpf) VALUES 
    ('a1', '11111111-1111-1111-1111-111111111111', 'João A', '111.111.111-11'),
    ('a2', '11111111-1111-1111-1111-111111111111', 'Maria A', '222.222.222-22')
  `);
  
  // ✅ RLS: Tenant A vê só 2!
  const result = await clientA.query('SELECT * FROM patients');
  expect(result.rows.length).toBe(2);
});
