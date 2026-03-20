import express from 'express';
import cors from 'cors';

// rotas
import patientsRoutes from './routes/patients.routes.js';
import authRoutes from './routes/auth.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import consentsRoutes from './routes/consents.routes.js';
import auditLogsRoutes from './routes/audit-logs.routes.js';
import documentTemplatesRoutes from './routes/document-templates.routes.js';

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// rotas básicas
app.get('/', (req, res) => {
  res.send('Servidor Nexus Platform está rodando!');
});

app.get('/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

// rota esperada pelos testes
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

// rotas da API
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/consents', consentsRoutes);
app.use('/api/v1/audit-logs', auditLogsRoutes);
app.use('/api/v1/document-templates', documentTemplatesRoutes);

// exporta a instância para ser usada em index.js e nos testes
export default app;
