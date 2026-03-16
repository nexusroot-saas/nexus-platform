/**
 * Middleware requireModule
 *
 * Verifica se o tenant do usuário autenticado possui o módulo ativo.
 * Deve ser usado APÓS authenticate e ANTES de authorize.
 *
 * Uso:
 *   router.get('/', authenticate, requireModule('NEXUSLEGAL'), authorize(...), handler)
 *
 * O array req.user.modules vem do JWT (preenchido no login com active_modules da empresa).
 */
export function requireModule(moduleName) {
  return (req, res, next) => {
    const { modules = [] } = req.user;

    if (!modules.includes(moduleName)) {
      return res.status(403).json({
        error: `O módulo ${moduleName} não está ativo neste tenant.`,
        module: moduleName,
      });
    }

    return next();
  };
}
