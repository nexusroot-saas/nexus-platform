import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import consentsRoutes from './routes/consents.routes.js';
import auditLogsRoutes from './routes/audit-logs.routes.js';
import rootUsersRoutes from './routes/root-users.routes.js';
import rootRoutes from './routes/root.routes.js';
import managerRoutes from './routes/manager.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import storageRoutes from './routes/storage.routes.js';
import docsRoutes from './routes/docs.routes.js';
import documentTemplatesRoutes from './routes/document-templates.routes.js';
import homeRoutes from './routes/home.routes.js';
import { startQueueProcessor } from './queues/webhook-queue.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URL_ROOT,
        'http://localhost:5173',
        'http://localhost:5174',
      ].filter(Boolean);
      if (
        !origin ||
        allowed.some((u) => origin.startsWith(u.replace(/\/$/, '')))
      ) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: '55mb' })); // suporta upload base64 de até ~40MB

// ── Rotas públicas ────────────────────────────────────────────────────────
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);

// ── Webhooks (sem autenticação JWT — usa HMAC) ────────────────────────────
app.use('/api/v1/webhooks', webhookRoutes);

// ── Rotas protegidas — core ───────────────────────────────────────────────
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/consents', consentsRoutes);
app.use('/api/v1/audit-logs', auditLogsRoutes);
app.use('/api/v1/storage', storageRoutes);

// ── NexusManager — gestor da unidade (TENANT_ADMIN) ───────────────────────
app.use('/api/v1/manager', managerRoutes);
app.use('/api/v1/document-templates', documentTemplatesRoutes);
// ── NexusRoot — painel da plataforma (ROOT) ───────────────────────────────
app.use('/api/v1/root/users', rootUsersRoutes);
app.use('/api/v1/root', rootRoutes);

// ── Documentação e home ───────────────────────────────────────────────────
app.use('/docs', docsRoutes);
app.use('/', homeRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ── Error handler global ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 api-server rodando na porta ${PORT}`);
    startQueueProcessor(5000);
  });
}

export default app;
