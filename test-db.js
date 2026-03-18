// test-db.js - Arquivo TEMPORÁRIO para teste
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Carrega .env.local

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  console.log('🔄 Testando conexão...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Conectado como:', client.user);
    
    // Testa RLS básico
    await client.query('SET app.currentcompanyid = ANY(SELECT id FROM companies LIMIT 1)');
    const companies = await client.query('SELECT COUNT(*) FROM companies');
    console.log('✅ RLS funcionando:', companies.rows[0].count, 'companies visíveis');
    
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log('✅ Usuários:', users.rows[0].count);
    
    client.release();
    console.log('🎉 DATABASE 100% PRONTO!');
  } catch (err) {
    console.error('❌ ERRO:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
