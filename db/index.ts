import * as dotenv from 'dotenv';
// Lädt .env.local explizit, damit die Variable sicher im Speicher ist
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Das ist der Sicherheits-Check
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL ist in der .env.local nicht gesetzt!');
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);