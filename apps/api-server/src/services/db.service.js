import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new pg.Pool({
  connectionString: 'postgresql://nexusapp:nexusapppass@localhost:5432/nexusdev',
  ssl: false
});
