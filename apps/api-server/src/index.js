import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globais ────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Rotas ──────────────────────────────────────────────────────────────────
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ── Error handler global ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`🚀 api-server rodando na porta ${PORT}`);
});

export default app;
