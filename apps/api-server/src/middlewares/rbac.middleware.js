const PERMISSIONS = {
  ROOT_ADMIN: {
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
    tenants: [],
  },
  MEDICO: {
    patients: ['read', 'update'],
    appointments: ['read', 'update'],
    consents: ['read'],
    financial: [],
    users: [],
    audit_logs: [],
    branding: [],
    tenants: [],
  },
  RECEPCIONISTA: {
    patients: ['read', 'create', 'update'],
    appointments: ['read', 'create', 'update', 'delete'],
    consents: ['read', 'create'],
    financial: [],
    users: [],
    audit_logs: [],
    branding: [],
    tenants: [],
  },
  FINANCEIRO: {
    patients: ['read'],
    appointments: ['read'],
    consents: [],
    financial: ['read', 'create', 'update'],
    users: [],
    audit_logs: [],
    branding: [],
    tenants: [],
  },
  DPO_EXTERNO: {
    patients: [],
    appointments: [],
    consents: ['read'],
    financial: [],
    users: [],
    audit_logs: ['read'],
    branding: [],
    tenants: [],
  },
};

export function authorize(resource, action) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: 'Nao autenticado.' });
    const allowed = (PERMISSIONS[role]?.[resource] || []).includes(action);
    if (!allowed) {
      return res.status(403).json({
        error: `Acesso negado. Role '${role}' nao tem permissao '${action}' em '${resource}'.`,
      });
    }
    next();
  };
}
