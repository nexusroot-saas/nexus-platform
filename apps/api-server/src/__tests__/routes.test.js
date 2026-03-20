import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Força ambiente de teste e define URL do banco
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgresql://nexus:nexus_dev_pass@localhost:5432/nexus_dev';

import app from '../index.js';

const JWT_SECRET = 'test-secret-minimo-32-caracteres-ok';

function makeToken(overrides = {}) {
  return jwt.sign(
    {
      sub: 'user-uuid-test',
      company_id: '00000000-0000-0000-0000-000000000001',
      role: 'TENANT_ADMIN',
      tenant_type: 'MED',
      modules: ['NEXUSMED', 'NEXUSLEGAL'],
      ...overrides,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.PORT = '3099';
});

describe('GET /health/live', () => {
  test('200 sem autenticação', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ... todos os outros describes e testes continuam iguais ...

describe('Rotas inexistentes', () => {
  test('404 para rota desconhecida', async () => {
    const res = await request(app).get('/api/v1/rota-que-nao-existe');
    expect(res.status).toBe(404);
  });
});

// Fecha pools e servidor após todos os testes
afterAll(async () => {
  const { pool, authPool } = await import('../config/db.js');
  await pool.end().catch(() => {});
  await authPool.end().catch(() => {});

  // Se index.js exportar um servidor, feche-o
  if (app && typeof app.close === 'function') {
    app.close();
  }
});
