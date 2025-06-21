import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../shared/sqlite-schema";
import { mkdirSync } from "fs";
import { dirname } from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const dbPath = process.env.DATABASE_URL.replace('file:', '');

// Create directory if it doesn't exist
const dbDir = dirname(dbPath);
try {
  mkdirSync(dbDir, { recursive: true });
} catch (error) {
  // Directory might already exist, ignore error
}

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });