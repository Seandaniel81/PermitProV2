import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../shared/sqlite-schema';

const dbPath = './permit_system.db';

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });