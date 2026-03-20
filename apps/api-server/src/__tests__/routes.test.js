import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Set env before importing app
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

describe('POST /api/v1/auth/login', () => {
  test('400 quando body está vazio', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/i);
  });

  test('400 quando falta senha', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  test('400 quando refresh_token não enviado', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatório/i);
  });
});

describe('POST /api/v1/auth/logout', () => {
  test('400 quando refresh_token não enviado', async () => {
    const res = await request(app).post('/api/v1/auth/logout').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/patients — autenticação', () => {
  test('401 sem token', async () => {
    const res = await request(app).get('/api/v1/patients');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/não fornecido/i);
  });

  test('401 com token expirado', async () => {
    const expired = jwt.sign(
      { sub: 'x', company_id: 'y', role: 'MEDICO' },
      JWT_SECRET,
      {
        expiresIn: '-1s',
      }
    );
    const res = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expirado/i);
  });

  test('401 com token inválido', async () => {
    const res = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', 'Bearer token-lixo');
    expect(res.status).toBe(401);
  });

  test('403 para DPO_EXTERNO (sem permissão patients:read)', async () => {
    const token = makeToken({ role: 'DPO_EXTERNO' });
    const res = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/document-templates — autenticação e existência de rota', () => {
  test('401 sem token', async () => {
    const res = await request(app).get('/api/v1/document-templates');
    expect(res.status).toBe(401);
  });

  test('403 com token sem permissão documenttemplates:read', async () => {
    const token = makeToken({ role: 'DPO_EXTERNO' });
    const res = await request(app)
      .get('/api/v1/document-templates')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/patients — validação', () => {
  test('401 sem token', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .send({ name: 'Teste' });
    expect(res.status).toBe(401);
  });

  test('403 para FINANCEIRO (sem permissão patients:create)', async () => {
    const token = makeToken({ role: 'FINANCEIRO' });
    const res = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Paciente Teste' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/appointments — autenticação', () => {
  test('401 sem token', async () => {
    const res = await request(app).get('/api/v1/appointments');
    expect(res.status).toBe(401);
  });

  test('403 para DPO_EXTERNO (sem permissão appointments:read)', async () => {
    const token = makeToken({ role: 'DPO_EXTERNO' });
    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/appointments — validação', () => {
  test('400 quando body não tem campos obrigatórios', async () => {
    const token = makeToken({ role: 'TENANT_ADMIN' });
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([400, 500]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.error).toMatch(/obrigatórios/i);
    }
  });
});

describe('GET /api/v1/consents — verificação de módulo', () => {
  test('403 quando tenant não tem módulo NEXUSLEGAL', async () => {
    const token = makeToken({ modules: ['NEXUSMED'] });
    const res = await request(app)
      .get('/api/v1/consents')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.module).toBe('NEXUSLEGAL');
  });

  test('403 para DPO_EXTERNO tentando criar consentimento', async () => {
    const token = makeToken({ role: 'DPO_EXTERNO', modules: ['NEXUSLEGAL'] });
    const res = await request(app)
      .post('/api/v1/consents/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ patient_id: 'uuid' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/audit-logs — autorização', () => {
  test('401 sem token', async () => {
    const res = await request(app).get('/api/v1/audit-logs');
    expect(res.status).toBe(401);
  });

  test('403 para MEDICO (sem permissão audit_logs:read)', async () => {
    const token = makeToken({ role: 'MEDICO' });
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('DPO_EXTERNO pode acessar audit_logs:read', async () => {
    const token = makeToken({ role: 'DPO_EXTERNO' });
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 500]).toContain(res.status);
  });
});

describe('Rotas inexistentes', () => {
  test('404 para rota desconhecida', async () => {
    const res = await request(app).get('/api/v1/rota-que-nao-existe');
    expect(res.status).toBe(404);
  });
});

afterAll(async () => {
  const { pool, authPool } = await import('../config/db.js');
  await pool.end().catch(() => {});
  await authPool.end().catch(() => {});
});

afterAll(async () => {
  const { pool, authPool } = await import('../config/db.js');
  await pool.end().catch(() => {});
  await authPool.end().catch(() => {});
});
