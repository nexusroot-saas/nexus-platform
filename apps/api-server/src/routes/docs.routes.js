import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

// Carrega o openapi.yaml em runtime
let spec;
try {
  const yamlPath = join(__dirname, '../../docs/openapi.yaml');
  spec = yaml.load(readFileSync(yamlPath, 'utf8'));
} catch (err) {
  console.error('[docs] Erro ao carregar openapi.yaml:', err.message);
  spec = {
    openapi: '3.0.0',
    info: { title: 'Nexus API', version: '1.0.0' },
    paths: {},
  };
}

// Swagger UI com tema customizado
const swaggerOptions = {
  customSiteTitle: 'Nexus Platform — API Docs',
  customCss: `
    .swagger-ui .topbar { background: #1a1a18; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::before {
      content: 'Nexus Platform API';
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
    }
    .swagger-ui .info .title { color: #1a1a18; }
    .swagger-ui .btn.authorize { background: #1a6cff; border-color: #1a6cff; color: #fff; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(spec, swaggerOptions));

// Endpoint para baixar o spec em JSON (útil para gerar SDKs)
router.get('/openapi.json', (_req, res) => {
  res.json(spec);
});

// Endpoint para baixar o spec em YAML
router.get('/openapi.yaml', (_req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml.dump(spec));
});

export default router;
