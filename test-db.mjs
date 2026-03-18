import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🔄 Testando conexão...');
console.log('📍 DATABASE_URL:', process.env.DATABASE_URL?.slice(0, 50) + '...');

const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20
};

const pool = new Pool(config);

(async () => {
  try {
    console.log('⏳ Conectando...');
    const client = await pool.connect();
    console.log('✅ CONECTADO!');
    
    const res = await client.query('SELECT NOW(), version()');
    console.log('⏰ Server time:', res.rows[0].now);
    console.log('🐘 Postgres:', res.rows[0].version.slice(0, 50));
    
    await client.query('SELECT 1 FROM pg_database WHERE datname = $1', ['nexus_dev']);
    console.log('✅ nexus_dev OK!');
    
    client.release();
    console.log('🎉 TESTE FINALIZADO!');
    process.exit(0);
  } catch (err) {
    console.error('❌ ERRO:');
    console.error('Mensagem:', err.message);
    console.error('Código:', err.code);
    process.exit(1);
  }
})();
