import { eq, desc, sql } from "drizzle-orm";
import type { IStorage } from "./storage";
import bcrypt from "bcrypt";
import { db } from "./sqlite-db";
import {
  users,
  settings,
  permitPackages,
  packageDocuments,
} from "@shared/sqlite-schema";

export class SimpleSQLiteStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<any | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: timestamp,
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<any[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: any): Promise<any | undefined> {
    const timestamp = Math.floor(Date.now() / 1000);
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: timestamp })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<any | undefined> {
    const timestamp = Math.floor(Date.now() / 1000);
    const [updated] = await db
      .update(users)
      .set({ passwordHash: hashedPassword, updatedAt: timestamp })
      .where(eq(users.id, id))
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
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async getAllSettings(): Promise<any[]> {
    return await db.select().from(settings).orderBy(settings.category, settings.key);
  }

  async getSettingsByCategory(category: string): Promise<any[]> {
    return await db.select().from(settings).where(eq(settings.category, category));
  }

  async upsertSetting(settingData: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const [setting] = await db
      .insert(settings)
      .values({ ...settingData, updatedAt: timestamp })
      .onConflictDoUpdate({
        target: settings.key,
        set: { ...settingData, updatedAt: timestamp },
      })
      .returning();
    return setting;
  }

  async updateSetting(id: number, updates: any): Promise<any | undefined> {
    const timestamp = Math.floor(Date.now() / 1000);
    const [updated] = await db
      .update(settings)
      .set({ ...updates, updatedAt: timestamp })
      .where(eq(settings.id, id))
      .returning();
    return updated;
  }

  // Package methods
  async getPackage(id: number): Promise<any | undefined> {
    const [pkg] = await db.select().from(permitPackages).where(eq(permitPackages.id, id));
    return pkg || undefined;
  }

  async getPackageWithDocuments(id: number): Promise<any | undefined> {
    const pkg = await this.getPackage(id);
    if (!pkg) return undefined;

    const documents = await this.getPackageDocuments(id);
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
  }

  async getAllPackages(): Promise<any[]> {
    const packages = await db.select().from(permitPackages).orderBy(desc(permitPackages.createdAt));
    
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
    const timestamp = Math.floor(Date.now() / 1000);
    const [pkg] = await db
      .insert(permitPackages)
      .values({
        ...packageData,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();
    return pkg;
  }

  async updatePackage(id: number, updates: any): Promise<any | undefined> {
    const timestamp = Math.floor(Date.now() / 1000);
    const [updated] = await db
      .update(permitPackages)
      .set({ ...updates, updatedAt: timestamp })
      .where(eq(permitPackages.id, id))
      .returning();
    return updated;
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await db
      .delete(permitPackages)
      .where(eq(permitPackages.id, id));
    return result.changes > 0;
  }

  // Document methods
  async getPackageDocuments(packageId: number): Promise<any[]> {
    return await db
      .select()
      .from(packageDocuments)
      .where(eq(packageDocuments.packageId, packageId))
      .orderBy(packageDocuments.documentName);
  }

  async getDocument(id: number): Promise<any | undefined> {
    const [doc] = await db.select().from(packageDocuments).where(eq(packageDocuments.id, id));
    return doc || undefined;
  }

  async createDocument(documentData: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const [doc] = await db
      .insert(packageDocuments)
      .values({
        ...documentData,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();
    return doc;
  }

  async updateDocument(id: number, updates: any): Promise<any | undefined> {
    const timestamp = Math.floor(Date.now() / 1000);
    const [updated] = await db
      .update(packageDocuments)
      .set({ ...updates, updatedAt: timestamp })
      .where(eq(packageDocuments.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(packageDocuments)
      .where(eq(packageDocuments.id, id));
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
    const packages = await db.select().from(permitPackages);
    
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