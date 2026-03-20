import express from 'express';
import cors from 'cors';
import patientsRoutes from './routes/patients.routes.js';

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// rotas
app.get('/', (req, res) => {
  res.send('Servidor Nexus Platform está rodando!');
});

app.get('/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.use('/api', patientsRoutes);

// exporta a instância para ser usada em index.js
export default app;
