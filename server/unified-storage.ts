import { eq, desc, sql } from "drizzle-orm";
import type { IStorage } from "./storage";
import bcrypt from "bcrypt";

// Determine database type and get configuration
function getDatabaseConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  
  const isPostgreSQL = process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://');
  const isSQLite = process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.endsWith('.db');
  
  if (isPostgreSQL) {
    return { type: 'postgresql' as const };
  } else if (isSQLite) {
    return { type: 'sqlite' as const };
  } else {
    throw new Error("Unsupported database type. Use postgresql:// or file: URLs");
  }
}

// Import database connections dynamically
let dbConnection: any;
let schema: any;
let dbType: 'postgresql' | 'sqlite';

const config = getDatabaseConfig();
dbType = config.type;

if (dbType === 'postgresql') {
  const pgDb = await import("./db");
  const pgSchema = await import("@shared/schema");
  dbConnection = pgDb.db;
  schema = pgSchema;
} else {
  const sqliteDb = await import("./sqlite-db");
  const sqliteSchema = await import("@shared/sqlite-schema");
  dbConnection = sqliteDb.db;
  schema = sqliteSchema;
}

export class UnifiedDatabaseStorage implements IStorage {
  private config: DatabaseConfig;
  private db: any;
  private tables: any;

  constructor() {
    this.config = DatabaseConfig.getInstance();
    this.db = this.config.db;
    this.tables = this.config.tables;
  }

  // User methods
  async getUser(id: string): Promise<any | undefined> {
    const [user] = await this.db.select().from(this.tables.users).where(eq(this.tables.users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const [user] = await this.db.select().from(this.tables.users).where(eq(this.tables.users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: any): Promise<any> {
    if (this.config.type === 'postgresql') {
      const [user] = await this.db
        .insert(this.tables.users)
        .values(userData)
        .onConflictDoUpdate({
          target: this.tables.users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } else {
      // SQLite - use INSERT OR REPLACE
      const [user] = await this.db
        .insert(this.tables.users)
        .values({
          ...userData,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .onConflictDoUpdate({
          target: this.tables.users.id,
          set: {
            ...userData,
            updatedAt: Math.floor(Date.now() / 1000),
          },
        })
        .returning();
      return user;
    }
  }

  async getAllUsers(): Promise<any[]> {
    return await this.db.select().from(this.tables.users).orderBy(desc(this.tables.users.createdAt));
  }

  async updateUser(id: string, updates: any): Promise<any | undefined> {
    const timestamp = this.config.type === 'postgresql' ? new Date() : Math.floor(Date.now() / 1000);
    const [updated] = await this.db
      .update(this.tables.users)
      .set({ ...updates, updatedAt: timestamp })
      .where(eq(this.tables.users.id, id))
      .returning();
    return updated;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<any | undefined> {
    const timestamp = this.config.type === 'postgresql' ? new Date() : Math.floor(Date.now() / 1000);
    const [updated] = await this.db
      .update(this.tables.users)
      .set({ passwordHash: hashedPassword, updatedAt: timestamp })
      .where(eq(this.tables.users.id, id))
      .returning();
    return updated;
  }

  async resetUserPassword(id: string): Promise<string> {
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await this.updateUserPassword(id, hashedPassword);
    return tempPassword;
  }

  // Settings methods
  async getSetting(key: string): Promise<any | undefined> {
    const [setting] = await this.db.select().from(this.tables.settings).where(eq(this.tables.settings.key, key));
    return setting || undefined;
  }

  async getAllSettings(): Promise<any[]> {
    return await this.db.select().from(this.tables.settings).orderBy(this.tables.settings.category, this.tables.settings.key);
  }

  async getSettingsByCategory(category: string): Promise<any[]> {
    return await this.db.select().from(this.tables.settings).where(eq(this.tables.settings.category, category));
  }

  async upsertSetting(settingData: any): Promise<any> {
    const timestamp = this.config.type === 'postgresql' ? new Date() : Math.floor(Date.now() / 1000);
    
    if (this.config.type === 'postgresql') {
      const [setting] = await this.db
        .insert(this.tables.settings)
        .values({ ...settingData, updatedAt: timestamp })
        .onConflictDoUpdate({
          target: this.tables.settings.key,
          set: { ...settingData, updatedAt: timestamp },
        })
        .returning();
      return setting;
    } else {
      const [setting] = await this.db
        .insert(this.tables.settings)
        .values({ ...settingData, updatedAt: timestamp })
        .onConflictDoUpdate({
          target: this.tables.settings.key,
          set: { ...settingData, updatedAt: timestamp },
        })
        .returning();
      return setting;
    }
  }

  async updateSetting(id: number, updates: any): Promise<any | undefined> {
    const timestamp = this.config.type === 'postgresql' ? new Date() : Math.floor(Date.now() / 1000);
    const [updated] = await this.db
      .update(this.tables.settings)
      .set({ ...updates, updatedAt: timestamp })
      .where(eq(this.tables.settings.id, id))
      .returning();
    return updated;
  }

  // Package methods
  async getPackage(id: number): Promise<any | undefined> {
    const [pkg] = await this.db.select().from(this.tables.permitPackages).where(eq(this.tables.permitPackages.id, id));
    return pkg || undefined;
  }

  async getPackageWithDocuments(id: number): Promise<any | undefined> {
    const pkg = await this.getPackage(id);
    if (!pkg) return undefined;

    const documents = await this.getPackageDocuments(id);
    const completedDocuments = documents.filter(doc => doc.isCompleted).length;
    const totalDocuments = documents.length;
    const progressPercentage = totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0;

    return {
      ...pkg,
      documents,
      completedDocuments,
      totalDocuments,
      progressPercentage,
    };
  }

  async getAllPackages(): Promise<any[]> {
    const packages = await this.db.select().from(this.tables.permitPackages).orderBy(desc(this.tables.permitPackages.createdAt));
    
    const packagesWithDocuments = await Promise.all(
      packages.map(async (pkg: any) => {
        const documents = await this.getPackageDocuments(pkg.id);
        const completedDocuments = documents.filter((doc: any) => doc.isCompleted).length;
        const totalDocuments = documents.length;
        const progressPercentage = totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0;

        return {
          ...pkg,
          documents,
          completedDocuments,
          totalDocuments,
          progressPercentage,
        };
      })
    );

    return packagesWithDocuments;
  }

  async createPackage(packageData: any): Promise<any> {
    const timestamp = this.config.type === 'postgresql' ? new Date() : Math.floor(Date.now() / 1000);
    const [pkg] = await this.db
      .insert(this.tables.permitPackages)
      .values({ ...packageData, createdAt: timestamp, updatedAt: timestamp })
      .returning();
    return pkg;
  }

  async updatePackage(id: number, updates: any): Promise<any | undefined> {
    const timestamp = this.config.type === 'postgresql' ? new Date() : Math.floor(Date.now() / 1000);
    const [updated] = await this.db
      .update(this.tables.permitPackages)
      .set({ ...updates, updatedAt: timestamp })
      .where(eq(this.tables.permitPackages.id, id))
      .returning();
    return updated;
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await this.db
      .delete(this.tables.permitPackages)
      .where(eq(this.tables.permitPackages.id, id));
    return result.changes > 0;
  }

  // Document methods
  async getPackageDocuments(packageId: number): Promise<any[]> {
    return await this.db
      .select()
      .from(this.tables.packageDocuments)
      .where(eq(this.tables.packageDocuments.packageId, packageId))
      .orderBy(this.tables.packageDocuments.documentName);
  }

  async getDocument(id: number): Promise<any | undefined> {
    const [doc] = await this.db.select().from(this.tables.packageDocuments).where(eq(this.tables.packageDocuments.id, id));
    return doc || undefined;
  }

  async createDocument(documentData: any): Promise<any> {
    const timestamp = this.config.type === 'postgresql' ? new Date() : Math.floor(Date.now() / 1000);
    const [doc] = await this.db
      .insert(this.tables.packageDocuments)
      .values({ ...documentData, createdAt: timestamp, updatedAt: timestamp })
      .returning();
    return doc;
  }

  async updateDocument(id: number, updates: any): Promise<any | undefined> {
    const timestamp = this.config.type === 'postgresql' ? new Date() : Math.floor(Date.now() / 1000);
    const [updated] = await this.db
      .update(this.tables.packageDocuments)
      .set({ ...updates, updatedAt: timestamp })
      .where(eq(this.tables.packageDocuments.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await this.db
      .delete(this.tables.packageDocuments)
      .where(eq(this.tables.packageDocuments.id, id));
    return result.changes > 0;
  }

  // Stats methods
  async getPackageStats(): Promise<{
    total: number;
    draft: number;
    inProgress: number;
    readyToSubmit: number;
    submitted: number;
  }> {
    const packages = await this.db.select().from(this.tables.permitPackages);
    
    const stats = {
      total: packages.length,
      draft: packages.filter((p: any) => p.status === 'draft').length,
      inProgress: packages.filter((p: any) => p.status === 'in_progress').length,
      readyToSubmit: packages.filter((p: any) => p.status === 'ready_to_submit').length,
      submitted: packages.filter((p: any) => p.status === 'submitted').length,
    };

    return stats;
  }
}