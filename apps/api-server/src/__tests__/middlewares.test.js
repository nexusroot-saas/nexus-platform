import { jest, describe, test, expect, beforeAll } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';

const JWT_SECRET = 'test-secret-minimo-32-caracteres-ok';

function makeToken(payload, expiresIn = '15m') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function mockReqRes(headers = {}, body = {}) {
  const req = { headers, body, user: null };
  const res = {
    _status: null,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._body = data;
      return this;
    },
  };
  const next = jest.fn();
  return { req, res, next };
}

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

describe('authenticate middleware', () => {
  test('401 quando não há header Authorization', () => {
    const { req, res, next } = mockReqRes();
    authenticate(req, res, next);
    expect(res._status).toBe(401);
    expect(res._body.error).toMatch(/não fornecido/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('401 quando token está expirado', () => {
    const token = makeToken(
      { sub: 'uuid', company_id: 'cid', role: 'MEDICO' },
      '-1s'
    );
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    authenticate(req, res, next);
    expect(res._status).toBe(401);
    expect(res._body.error).toMatch(/expirado/i);
  });

  test('401 quando token é inválido', () => {
    const { req, res, next } = mockReqRes({
      authorization: 'Bearer token-invalido',
    });
    authenticate(req, res, next);
    expect(res._status).toBe(401);
    expect(res._body.error).toMatch(/inválido/i);
  });

  test('injeta req.user e chama next() com token válido', () => {
    const payload = {
      sub: 'user-uuid',
      company_id: 'company-uuid',
      role: 'TENANT_ADMIN',
      tenant_type: 'MED',
      modules: ['NEXUSMED'],
    };
    const token = makeToken(payload);
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.sub).toBe('user-uuid');
    expect(req.user.company_id).toBe('company-uuid');
    expect(req.user.role).toBe('TENANT_ADMIN');
  });
});

describe('authorize middleware', () => {
  function makeAuthorizeReq(role) {
    return { user: { role } };
  }

  test('403 para DPO_EXTERNO tentando acessar patients:read', () => {
    const req = makeAuthorizeReq('DPO_EXTERNO');
    const { res, next } = mockReqRes();
    authorize('patients', 'read')(req, res, next);
    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('MEDICO pode fazer patients:read', () => {
    const req = makeAuthorizeReq('MEDICO');
    const { res, next } = mockReqRes();
    authorize('patients', 'read')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('RECEPCIONISTA NÃO pode fazer patients:delete', () => {
    const req = makeAuthorizeReq('RECEPCIONISTA');
    const { res, next } = mockReqRes();
    authorize('patients', 'delete')(req, res, next);
    expect(res._status).toBe(403);
  });

  test('TENANT_ADMIN pode fazer appointments:delete', () => {
    const req = makeAuthorizeReq('TENANT_ADMIN');
    const { res, next } = mockReqRes();
    authorize('appointments', 'delete')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('DPO_EXTERNO pode fazer consents:read', () => {
    const req = makeAuthorizeReq('DPO_EXTERNO');
    const { res, next } = mockReqRes();
    authorize('consents', 'read')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('403 para role inexistente', () => {
    const req = makeAuthorizeReq('ROLE_INEXISTENTE');
    const { res, next } = mockReqRes();
    authorize('patients', 'read')(req, res, next);
    expect(res._status).toBe(403);
  });
});
