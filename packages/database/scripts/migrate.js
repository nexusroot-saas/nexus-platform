import { pool } from '../src/db.js';

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.end();
  console.log('Migrations applied.');
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
