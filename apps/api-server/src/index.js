import express from 'express';
import cors from 'cors';
import patientsRoutes from './routes/patients.routes.js';

const app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Servidor Nexus Platform está rodando!');
});

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use('/api', patientsRoutes);

app.listen(3001, () => {
  console.log('🚀 Nexus API Server: http://localhost:3001');
  console.log('📊 Health: http://localhost:3001/health');
  console.log('👥 Patients: http://localhost:3001/api/v1/patients');
});
