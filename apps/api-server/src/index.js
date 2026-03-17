import 'dotenv/config';
import express from 'express';
import cors from 'cors';
 
import healthRoutes      from './routes/health.routes.js';
import authRoutes        from './routes/auth.routes.js';
import patientsRoutes    from './routes/patients.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import consentsRoutes    from './routes/consents.routes.js';
import auditLogsRoutes   from './routes/audit-logs.routes.js';
import rootUsersRoutes   from './routes/root-users.routes.js';
import rootRoutes        from './routes/root.routes.js';
import managerRoutes     from './routes/manager.routes.js';
import docsRoutes        from './routes/docs.routes.js';
import homeRoutes        from './routes/home.routes.js';
 
const app = express();
const PORT = process.env.PORT || 3001;
 
// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_ROOT,
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean);
    if (!origin || allowed.some(u => origin.startsWith(u.replace(/\/$/, '')))) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));
 
app.use(express.json());
 
// ── Rotas públicas ────────────────────────────────────────────────────────
app.use('/health',              healthRoutes);
app.use('/api/v1/auth',         authRoutes);
 
// ── Rotas protegidas — core ───────────────────────────────────────────────
app.use('/api/v1/patients',     patientsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/consents',     consentsRoutes);
app.use('/api/v1/audit-logs',   auditLogsRoutes);
 
// ── NexusManager — gestor da unidade (TENANT_ADMIN) ───────────────────────
app.use('/api/v1/manager',      managerRoutes);
 
// ── NexusRoot — painel da plataforma (ROOT) ───────────────────────────────
// rootUsersRoutes ANTES de rootRoutes para evitar conflito de prefixo
app.use('/api/v1/root/users',   rootUsersRoutes);
app.use('/api/v1/root',         rootRoutes);
 
// ── Documentação e home ───────────────────────────────────────────────────
app.use('/docs',                docsRoutes);
app.use('/',                    homeRoutes);
 
// ── 404 fallback ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});
 
// ── Error handler global ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});
 
app.listen(PORT, () => {
  console.log(`🚀 api-server rodando na porta ${PORT}`);
});
 
export default app;