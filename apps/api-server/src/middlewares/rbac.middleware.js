/**
 * Matriz RBAC — Seção 34.2 da documentação Nexus
 *
 * Legenda: R=read C=create U=update D=delete
 */
const PERMISSIONS = {
  ROOT: {
    patients: ['read', 'create', 'update'],
    appointments: ['read'],
    consents: ['read', 'create', 'update'],
    financial: ['read'],
    users: ['read', 'create', 'update', 'delete'],
    audit_logs: ['read'],
    branding: ['read', 'create', 'update'],
    tenants: ['read', 'create', 'update', 'delete'],
  },
  TENANT_ADMIN: {
    patients: ['read', 'create', 'update', 'delete'],
    appointments: ['read', 'create', 'update', 'delete'],
    consents: ['read', 'create', 'update'],
    financial: ['read', 'create', 'update', 'delete'],
    users: ['read', 'create', 'update', 'delete'],
    audit_logs: ['read'],
    branding: ['read', 'create', 'update'],
  },
  MEDICO: {
    patients: ['read', 'update'],
    appointments: ['read', 'update'],
    consents: ['read'],
  },
  RECEPCIONISTA: {
    patients: ['read', 'create', 'update'],
    appointments: ['read', 'create', 'update', 'delete'],
    consents: ['read', 'create'],
    financial: ['read'],
  },
  FINANCEIRO: {
    patients: ['read'],
    appointments: ['read'],
    financial: ['read', 'create', 'update'],
  },
  DPO_EXTERNO: {
    consents: ['read'],
    audit_logs: ['read'],
  },
};

/**
 * Middleware authorize
 *
 * Uso: router.get('/', authenticate, authorize('patients', 'read'), handler)
 *
 * Respostas de erro:
 *  403 — Role sem permissão para o recurso/ação
 */
export function authorize(resource, action) {
  return (req, res, next) => {
    const { role } = req.user;
    const rolePerms = PERMISSIONS[role];

    if (!rolePerms) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const resourcePerms = rolePerms[resource] || [];

    if (!resourcePerms.includes(action)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    return next();
  };
}
