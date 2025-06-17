import { 
  PermitPackage, 
  InsertPermitPackage, 
  UpdatePermitPackage,
  PackageDocument, 
  InsertDocument, 
  UpdateDocument,
  PackageWithDocuments,
  User,
  UpsertUser,
  Setting,
  InsertSetting,
  UpdateSetting,
  PACKAGE_STATUSES,
  permitPackages,
  packageDocuments,
  users,
  settings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
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
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser || undefined;
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
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
      .values({
        ...settingData,
        updatedAt: new Date(),
      })
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
    const [updatedSetting] = await db
      .update(settings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, id))
      .returning();

    return updatedSetting || undefined;
  }
  async getPackage(id: number): Promise<PermitPackage | undefined> {
    const [pkg] = await db.select().from(permitPackages).where(eq(permitPackages.id, id));
    return pkg || undefined;
  }

  async getPackageWithDocuments(id: number): Promise<PackageWithDocuments | undefined> {
    const pkg = await this.getPackage(id);
    if (!pkg) return undefined;

    const documents = await db.select()
      .from(packageDocuments)
      .where(eq(packageDocuments.packageId, id));
    
    const completedDocuments = documents.filter(doc => doc.isCompleted === 1).length;
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

  async getAllPackages(): Promise<PackageWithDocuments[]> {
    const packages = await db.select()
      .from(permitPackages)
      .orderBy(desc(permitPackages.createdAt));
    
    const packagesWithDocuments = await Promise.all(
      packages.map(async (pkg) => {
        const result = await this.getPackageWithDocuments(pkg.id);
        return result!;
      })
    );
    
    return packagesWithDocuments;
  }

  async createPackage(packageData: InsertPermitPackage): Promise<PermitPackage> {
    const [newPackage] = await db
      .insert(permitPackages)
      .values({
        ...packageData,
        status: packageData.status || 'draft',
      })
      .returning();
    
    return newPackage;
  }

  async updatePackage(id: number, updates: UpdatePermitPackage): Promise<PermitPackage | undefined> {
    const [updatedPackage] = await db
      .update(permitPackages)
      .set({
        ...updates,
        updatedAt: new Date(),
        submittedAt: updates.status === PACKAGE_STATUSES.SUBMITTED ? new Date() : undefined,
      })
      .where(eq(permitPackages.id, id))
      .returning();

    return updatedPackage || undefined;
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await db
      .delete(permitPackages)
      .where(eq(permitPackages.id, id));

    return (result.rowCount || 0) > 0;
  }

  async getPackageDocuments(packageId: number): Promise<PackageDocument[]> {
    return await db.select()
      .from(packageDocuments)
      .where(eq(packageDocuments.packageId, packageId));
  }

  async getDocument(id: number): Promise<PackageDocument | undefined> {
    const [document] = await db.select()
      .from(packageDocuments)
      .where(eq(packageDocuments.id, id));
    
    return document || undefined;
  }

  async createDocument(documentData: InsertDocument): Promise<PackageDocument> {
    const [newDocument] = await db
      .insert(packageDocuments)
      .values({
        ...documentData,
        isRequired: documentData.isRequired || 0,
        isCompleted: documentData.isCompleted || 0,
      })
      .returning();
    
    return newDocument;
  }

  async updateDocument(id: number, updates: UpdateDocument): Promise<PackageDocument | undefined> {
    const [updatedDocument] = await db
      .update(packageDocuments)
      .set({
        ...updates,
        uploadedAt: updates.isCompleted === 1 ? new Date() : undefined,
      })
      .where(eq(packageDocuments.id, id))
      .returning();

    return updatedDocument || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(packageDocuments)
      .where(eq(packageDocuments.id, id));

    return (result.rowCount || 0) > 0;
  }

  async getPackageStats(): Promise<{
    total: number;
    draft: number;
    inProgress: number;
    readyToSubmit: number;
    submitted: number;
  }> {
    const packages = await db.select().from(permitPackages);
    
    return {
      total: packages.length,
      draft: packages.filter(p => p.status === PACKAGE_STATUSES.DRAFT).length,
      inProgress: packages.filter(p => p.status === PACKAGE_STATUSES.IN_PROGRESS).length,
      readyToSubmit: packages.filter(p => p.status === PACKAGE_STATUSES.READY_TO_SUBMIT).length,
      submitted: packages.filter(p => p.status === PACKAGE_STATUSES.SUBMITTED).length,
    };
  }
}