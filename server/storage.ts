import {
  users,
  settings,
  permitPackages,
  packageDocuments,
  type User,
  type UpsertUser,
  type InsertUser,
  type UpdateUser,
  type Setting,
  type InsertSetting,
  type UpdateSetting,
  type PermitPackage,
  type InsertPermitPackage,
  type UpdatePermitPackage,
  type PackageDocument,
  type InsertDocument,
  type UpdateDocument,
  type PackageWithDocuments,
  DEFAULT_SETTINGS,
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  resetUserPassword(id: string): Promise<string>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  getSettingsByCategory(category: string): Promise<Setting[]>;
  upsertSetting(settingData: InsertSetting): Promise<Setting>;
  updateSetting(id: number, updates: UpdateSetting): Promise<Setting | undefined>;
  
  // Package operations
  getPackage(id: number): Promise<PermitPackage | undefined>;
  getPackageWithDocuments(id: number): Promise<PackageWithDocuments | undefined>;
  getAllPackages(): Promise<PackageWithDocuments[]>;
  createPackage(packageData: InsertPermitPackage): Promise<PermitPackage>;
  updatePackage(id: number, updates: UpdatePermitPackage): Promise<PermitPackage | undefined>;
  deletePackage(id: number): Promise<boolean>;
  
  // Document operations
  getPackageDocuments(packageId: number): Promise<PackageDocument[]>;
  getDocument(id: number): Promise<PackageDocument | undefined>;
  createDocument(documentData: InsertDocument): Promise<PackageDocument>;
  updateDocument(id: number, updates: UpdateDocument): Promise<PackageDocument | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Statistics
  getPackageStats(): Promise<{
    total: number;
    draft: number;
    inProgress: number;
    readyToSubmit: number;
    submitted: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ passwordHash: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async resetUserPassword(id: string): Promise<string> {
    const newPassword = Math.random().toString(36).slice(-8);
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.updateUserPassword(id, hashedPassword);
    return newPassword;
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(settings.category, settings.key);
  }

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return await db.select().from(settings).where(eq(settings.category, category));
  }

  async upsertSetting(settingData: InsertSetting): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values(settingData)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          ...settingData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  async updateSetting(id: number, updates: UpdateSetting): Promise<Setting | undefined> {
    const [setting] = await db
      .update(settings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(settings.id, id))
      .returning();
    return setting;
  }

  // Package operations
  async getPackage(id: number): Promise<PermitPackage | undefined> {
    const [pkg] = await db.select().from(permitPackages).where(eq(permitPackages.id, id));
    return pkg;
  }

  async getPackageWithDocuments(id: number): Promise<PackageWithDocuments | undefined> {
    const pkg = await this.getPackage(id);
    if (!pkg) return undefined;

    const documents = await this.getPackageDocuments(id);
    const totalDocuments = documents.length;
    const completedDocuments = documents.filter(doc => doc.isCompleted).length;
    const progressPercentage = totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0;

    return {
      ...pkg,
      documents,
      completedDocuments,
      totalDocuments,
      progressPercentage,
    };
  }

  async getAllPackages(): Promise<PackageWithDocuments[]> {
    const packages = await db.select().from(permitPackages).orderBy(desc(permitPackages.createdAt));
    
    const packagesWithDocuments = await Promise.all(
      packages.map(async (pkg) => {
        const documents = await this.getPackageDocuments(pkg.id);
        const totalDocuments = documents.length;
        const completedDocuments = documents.filter(doc => doc.isCompleted).length;
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

  async createPackage(packageData: InsertPermitPackage): Promise<PermitPackage> {
    const [pkg] = await db.insert(permitPackages).values(packageData).returning();
    return pkg;
  }

  async updatePackage(id: number, updates: UpdatePermitPackage): Promise<PermitPackage | undefined> {
    const [pkg] = await db
      .update(permitPackages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(permitPackages.id, id))
      .returning();
    return pkg;
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await db.delete(permitPackages).where(eq(permitPackages.id, id));
    return result.rowCount > 0;
  }

  // Document operations
  async getPackageDocuments(packageId: number): Promise<PackageDocument[]> {
    return await db
      .select()
      .from(packageDocuments)
      .where(eq(packageDocuments.packageId, packageId))
      .orderBy(packageDocuments.documentName);
  }

  async getDocument(id: number): Promise<PackageDocument | undefined> {
    const [document] = await db.select().from(packageDocuments).where(eq(packageDocuments.id, id));
    return document;
  }

  async createDocument(documentData: InsertDocument): Promise<PackageDocument> {
    const [document] = await db.insert(packageDocuments).values(documentData).returning();
    return document;
  }

  async updateDocument(id: number, updates: UpdateDocument): Promise<PackageDocument | undefined> {
    const [document] = await db
      .update(packageDocuments)
      .set(updates)
      .where(eq(packageDocuments.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(packageDocuments).where(eq(packageDocuments.id, id));
    return result.rowCount > 0;
  }

  async getPackageStats(): Promise<{
    total: number;
    draft: number;
    inProgress: number;
    readyToSubmit: number;
    submitted: number;
  }> {
    const totalResult = await db.select({ count: count() }).from(permitPackages);
    const draftResult = await db.select({ count: count() }).from(permitPackages).where(eq(permitPackages.status, 'draft'));
    const inProgressResult = await db.select({ count: count() }).from(permitPackages).where(eq(permitPackages.status, 'in_progress'));
    const readyResult = await db.select({ count: count() }).from(permitPackages).where(eq(permitPackages.status, 'ready_to_submit'));
    const submittedResult = await db.select({ count: count() }).from(permitPackages).where(eq(permitPackages.status, 'submitted'));

    return {
      total: totalResult[0]?.count || 0,
      draft: draftResult[0]?.count || 0,
      inProgress: inProgressResult[0]?.count || 0,
      readyToSubmit: readyResult[0]?.count || 0,
      submitted: submittedResult[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();