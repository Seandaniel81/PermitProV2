import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { Pool } from 'pg';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

// Determine database type from URL
function getDatabaseType(url: string) {
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return 'postgresql';
  } else if (url.startsWith('file:') || url.endsWith('.db')) {
    return 'sqlite';
  }
  throw new Error('Unsupported database type. Use postgresql:// or file: URLs');
}

// Initialize database connection based on type
export function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const dbType = getDatabaseType(process.env.DATABASE_URL);
  
  if (dbType === 'postgresql') {
    // PostgreSQL setup
    const pgSchema = require('@shared/schema');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL.includes('localhost') 
        ? { rejectUnauthorized: false } 
        : false
    });
    return { 
      db: drizzle(pool, { schema: pgSchema }), 
      type: 'postgresql' as const,
      pool 
    };
  } else {
    // SQLite setup
    const sqliteSchema = require('@shared/sqlite-schema');
    const dbPath = process.env.DATABASE_URL.replace('file:', '');
    
    // Create directory if it doesn't exist
    const dbDir = dirname(dbPath);
    try {
      mkdirSync(dbDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    const sqlite = new Database(dbPath);
    return { 
      db: drizzleSqlite(sqlite, { schema: sqliteSchema }), 
      type: 'sqlite' as const,
      sqlite 
    };
  }
}

// Export the initialized database
const dbConnection = initializeDatabase();
export const db = dbConnection.db;
export const dbType = dbConnection.type;
export const pool = 'pool' in dbConnection ? dbConnection.pool : null;
export const sqlite = 'sqlite' in dbConnection ? dbConnection.sqlite : null;