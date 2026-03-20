import app from './app.js';

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Nexus API Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Patients: http://localhost:${PORT}/api/v1/patients`);
});
