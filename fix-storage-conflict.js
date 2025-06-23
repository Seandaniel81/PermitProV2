#!/usr/bin/env node

// Fix for storage initialization conflict
// This script patches the storage module to properly handle SQLite configuration

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing storage initialization conflict...');

// Read the current storage.ts file
const storagePath = path.join(__dirname, 'server', 'storage.ts');
const storageContent = fs.readFileSync(storagePath, 'utf8');

// Create the fixed storage content
const fixedStorageContent = `import type { User, UpsertUser, InsertSetting, UpdateSetting, Setting } from "@shared/schema";
import type { 
  PermitPackage, 
  InsertPermitPackage, 
  UpdatePermitPackage, 
  PackageDocument, 
  InsertDocument, 
  UpdateDocument,
  PackageWithDocuments 
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  resetUserPassword(id: string): Promise<string>; // Returns temporary password
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  getSettingsByCategory(category: string): Promise<Setting[]>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(id: number, updates: UpdateSetting): Promise<Setting | undefined>;
  
  // Package methods
  getPackage(id: number): Promise<PermitPackage | undefined>;
  getPackageWithDocuments(id: number): Promise<PackageWithDocuments | undefined>;
  getAllPackages(): Promise<PackageWithDocuments[]>;
  createPackage(packageData: InsertPermitPackage): Promise<PermitPackage>;
  updatePackage(id: number, updates: UpdatePermitPackage): Promise<PermitPackage | undefined>;
  deletePackage(id: number): Promise<boolean>;
  
  // Document methods
  getPackageDocuments(packageId: number): Promise<PackageDocument[]>;
  getDocument(id: number): Promise<PackageDocument | undefined>;
  createDocument(documentData: InsertDocument): Promise<PackageDocument>;
  updateDocument(id: number, updates: UpdateDocument): Promise<PackageDocument | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Stats methods
  getPackageStats(): Promise<{
    total: number;
    draft: number;
    inProgress: number;
    readyToSubmit: number;
    submitted: number;
  }>;
}

// Dynamically choose storage based on configuration - FIXED VERSION
function createStorage(): IStorage {
  // Check for forced local auth FIRST before any database operations
  if (process.env.FORCE_LOCAL_AUTH === 'true') {
    console.log('FORCE_LOCAL_AUTH detected - using SimpleSQLiteStorage');
    const { SimpleSQLiteStorage } = require('./simple-sqlite-storage');
    return new SimpleSQLiteStorage();
  }
  
  console.log('Storage initialization - DATABASE_URL:', process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.warn("No DATABASE_URL found, using in-memory storage");
    const { MemStorage } = require('./storage-mem');
    return new MemStorage();
  }
  
  const isPostgreSQL = process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://');
  const isSQLite = process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.endsWith('.db');
  
  console.log('Storage checks - isPostgreSQL:', isPostgreSQL, 'isSQLite:', isSQLite);
  
  if (isPostgreSQL) {
    console.log('Using DatabaseStorage for PostgreSQL');
    const { DatabaseStorage } = require('./database-storage');
    return new DatabaseStorage();
  } else if (isSQLite) {
    console.log('Using SimpleSQLiteStorage for SQLite');
    const { SimpleSQLiteStorage } = require('./simple-sqlite-storage');
    return new SimpleSQLiteStorage();
  } else {
    console.warn("Unknown database type, using in-memory storage");
    const { MemStorage } = require('./storage-mem');
    return new MemStorage();
  }
}

export const storage = createStorage();

// MemStorage implementation for fallback
class MemStorage implements IStorage {
  private packages: Map<number, PermitPackage> = new Map();
  private documents: Map<number, PackageDocument> = new Map();
  private users: Map<string, User> = new Map();
  private settings: Map<string, Setting> = new Map();
  private currentPackageId: number = 1;
  private currentDocumentId: number = 1;

  constructor() {
    this.initializeSampleData();
  }

  async getUser(id: string): Promise<User | undefined> { return undefined; }
  async getUserByEmail(email: string): Promise<User | undefined> { return undefined; }
  async upsertUser(userData: UpsertUser): Promise<User> { 
    throw new Error('User operations not supported in MemStorage');
  }
  async getAllUsers(): Promise<User[]> { return []; }
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> { return undefined; }
  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> { return undefined; }
  async resetUserPassword(id: string): Promise<string> { return "temp-password"; }

  async getSetting(key: string): Promise<Setting | undefined> { return undefined; }
  async getAllSettings(): Promise<Setting[]> { return []; }
  async getSettingsByCategory(category: string): Promise<Setting[]> { return []; }
  async upsertSetting(settingData: InsertSetting): Promise<Setting> { 
    throw new Error('Setting operations not supported in MemStorage');
  }
  async updateSetting(id: number, updates: UpdateSetting): Promise<Setting | undefined> { return undefined; }

  private initializeSampleData() {
    // Initialize sample packages and documents
    const samplePackages = [
      {
        id: 1,
        clientName: "Sample Client",
        projectAddress: "123 Main St",
        projectDescription: "Sample residential project",
        permitType: "building",
        status: "draft" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const sampleDocuments = [
      {
        id: 1,
        packageId: 1,
        name: "Site Plan",
        description: "Architectural site plan",
        required: true,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    samplePackages.forEach(pkg => this.packages.set(pkg.id, pkg));
    sampleDocuments.forEach(doc => this.documents.set(doc.id, doc));
  }

  async getPackage(id: number): Promise<PermitPackage | undefined> {
    return this.packages.get(id);
  }

  async getPackageWithDocuments(id: number): Promise<PackageWithDocuments | undefined> {
    const pkg = this.packages.get(id);
    if (!pkg) return undefined;

    const documents = Array.from(this.documents.values()).filter(doc => doc.packageId === id);
    return { ...pkg, documents };
  }

  async getAllPackages(): Promise<PackageWithDocuments[]> {
    const packages = Array.from(this.packages.values());
    return packages.map(pkg => ({
      ...pkg,
      documents: Array.from(this.documents.values()).filter(doc => doc.packageId === pkg.id)
    }));
  }

  async createPackage(packageData: InsertPermitPackage): Promise<PermitPackage> {
    const pkg: PermitPackage = {
      id: this.currentPackageId++,
      ...packageData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.packages.set(pkg.id, pkg);
    return pkg;
  }

  async updatePackage(id: number, updates: UpdatePermitPackage): Promise<PermitPackage | undefined> {
    const pkg = this.packages.get(id);
    if (!pkg) return undefined;

    const updatedPackage: PermitPackage = {
      ...pkg,
      ...updates,
      updatedAt: new Date()
    };
    this.packages.set(id, updatedPackage);
    return updatedPackage;
  }

  async deletePackage(id: number): Promise<boolean> {
    const deleted = this.packages.delete(id);
    if (deleted) {
      Array.from(this.documents.keys())
        .filter(docId => this.documents.get(docId)?.packageId === id)
        .forEach(docId => this.documents.delete(docId));
    }
    return deleted;
  }

  async getPackageDocuments(packageId: number): Promise<PackageDocument[]> {
    return Array.from(this.documents.values()).filter(doc => doc.packageId === packageId);
  }

  async getDocument(id: number): Promise<PackageDocument | undefined> {
    return this.documents.get(id);
  }

  async createDocument(documentData: InsertDocument): Promise<PackageDocument> {
    const doc: PackageDocument = {
      id: this.currentDocumentId++,
      ...documentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.documents.set(doc.id, doc);
    return doc;
  }

  async updateDocument(id: number, updates: UpdateDocument): Promise<PackageDocument | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    const updatedDocument: PackageDocument = {
      ...doc,
      ...updates,
      updatedAt: new Date(),
      uploadedAt: updates.isCompleted === true ? new Date() : doc.uploadedAt,
    };

    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getPackageStats(): Promise<{
    total: number;
    draft: number;
    inProgress: number;
    readyToSubmit: number;
    submitted: number;
  }> {
    const packages = Array.from(this.packages.values());
    
    return {
      total: packages.length,
      draft: packages.filter(p => p.status === 'draft').length,
      inProgress: packages.filter(p => p.status === 'in_progress').length,
      readyToSubmit: packages.filter(p => p.status === 'ready_to_submit').length,
      submitted: packages.filter(p => p.status === 'submitted').length,
    };
  }
}`;

// Write the fixed storage content
fs.writeFileSync(storagePath, fixedStorageContent);

console.log('✅ Storage initialization conflict fixed');
console.log('✅ SQLite authentication will now take priority when FORCE_LOCAL_AUTH=true');