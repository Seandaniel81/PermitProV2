import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../shared/sqlite-schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const dbPath = process.env.DATABASE_URL.replace('file:', '');
export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });