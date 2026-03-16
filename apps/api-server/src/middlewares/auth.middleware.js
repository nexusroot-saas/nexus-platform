import jwt from 'jsonwebtoken';

/**
 * Middleware authenticate
 *
 * Fluxo:
 *  1. Verifica header Authorization: Bearer <token>
 *  2. Valida assinatura e expiração do JWT
 *  3. Injeta req.user = { sub, company_id, role, tenant_type, modules }
 *  4. Chama next()
 *
 * Respostas de erro:
 *  401 — Token não fornecido
 *  401 — Token expirado
 *  401 — Token inválido
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      sub: payload.sub,
      company_id: payload.company_id,
      role: payload.role,
      tenant_type: payload.tenant_type,
      modules: payload.modules || [],
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado.' });
    }
    return res.status(401).json({ error: 'Token inválido.' });
  }
}
