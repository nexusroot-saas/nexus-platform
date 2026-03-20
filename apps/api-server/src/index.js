import app from './app.js';

const PORT = process.env.PORT || 3001;

// Se não estiver em ambiente de teste, inicia o servidor normalmente
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Nexus API Server: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`👥 Patients: http://localhost:${PORT}/api/v1/patients`);
  });
}

// Exporta diferente conforme o ambiente:
// - Em produção/dev: exporta o server (com listen)
// - Em teste: exporta apenas o app (sem listen)
export default process.env.NODE_ENV === 'test' ? app : server;
