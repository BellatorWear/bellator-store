import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema'; // <--- WICHTIG: Schema importieren

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL ist in der .env.local nicht gesetzt!');
}

const sql = neon(process.env.DATABASE_URL!);

// Hier das schema-Objekt als zweiten Parameter übergeben:
export const db = drizzle(sql, { schema });