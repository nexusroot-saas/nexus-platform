import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Nexus Platform API</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f1117;color:#e6edf3;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#161b22;border:1px solid #30363d;border-radius:16px;padding:40px 48px;max-width:560px;width:100%}
    .logo{width:48px;height:48px;background:#1a6cff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;margin-bottom:20px}
    h1{font-size:22px;font-weight:600;margin-bottom:6px;letter-spacing:-0.3px}
    .sub{font-size:14px;color:#8b949e;margin-bottom:28px;line-height:1.5}
    .badge{display:inline-flex;align-items:center;gap:6px;background:#0d2117;color:#3fb950;border:1px solid #1a4a2a;border-radius:100px;font-size:12px;font-weight:500;padding:4px 12px;margin-bottom:28px}
    .badge::before{content:'●';font-size:8px}
    .links{display:flex;flex-direction:column;gap:10px}
    .link{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#1c2128;border:1px solid #30363d;border-radius:10px;text-decoration:none;color:#e6edf3;transition:border-color .15s,background .15s}
    .link:hover{background:#21262d;border-color:#58a6ff}
    .link-left{display:flex;flex-direction:column;gap:2px}
    .link-title{font-size:14px;font-weight:500}
    .link-desc{font-size:12px;color:#8b949e}
    .link-arrow{color:#8b949e;font-size:16px}
    .link:hover .link-arrow{color:#58a6ff}
    .divider{border:none;border-top:1px solid #30363d;margin:24px 0}
    .footer{font-size:11px;color:#656d76;text-align:center}
    .stack{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px}
    .pill{background:#1c2128;border:1px solid #30363d;border-radius:6px;font-size:11px;color:#8b949e;padding:3px 8px}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">N</div>
    <h1>Nexus Platform API</h1>
    <p class="sub">Plataforma SaaS de Gestão em Saúde &amp; Compliance LGPD.<br/>API REST — versão 1.0.0</p>
    <div class="badge">Online · v1.0.0</div>

    <div class="stack">
      <span class="pill">Node.js 20</span>
      <span class="pill">Express 4</span>
      <span class="pill">PostgreSQL 16</span>
      <span class="pill">JWT + RLS</span>
      <span class="pill">Multi-tenant</span>
    </div>

    <div class="links">
      <a href="/docs" class="link">
        <div class="link-left">
          <span class="link-title">📄 Documentação interativa</span>
          <span class="link-desc">Swagger UI — explore e teste todos os endpoints</span>
        </div>
        <span class="link-arrow">→</span>
      </a>
      <a href="/docs/openapi.json" class="link">
        <div class="link-left">
          <span class="link-title">⚙️ OpenAPI Spec (JSON)</span>
          <span class="link-desc">Baixar especificação para gerar SDKs</span>
        </div>
        <span class="link-arrow">→</span>
      </a>
      <a href="/health/ready" class="link">
        <div class="link-left">
          <span class="link-title">🩺 Health check</span>
          <span class="link-desc">Status do servidor e conexão com banco</span>
        </div>
        <span class="link-arrow">→</span>
      </a>
    </div>

    <div class="divider"></div>
    <p class="footer">Nexus Platform · Multi-tenant · LGPD · © 2026</p>
  </div>
</body>
</html>`);
});

export default router;
