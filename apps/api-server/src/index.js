import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Rotas
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

app.listen(PORT, () => {
  console.log(`Nexus API rodando na porta ${PORT}`);
});

export default app;
