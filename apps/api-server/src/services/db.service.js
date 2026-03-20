import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Se existir DATABASE_URL, usa direto.
// Caso contrário, cai para variáveis individuais com defaults.
export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        user: process.env.PGUSER || 'nexus',
        password: process.env.PGPASSWORD || 'nexusdevpass',
        database: process.env.PGDATABASE || 'nexus_test',
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || 5432,
        ssl: false,
      }
);
