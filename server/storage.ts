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
  DEFAULT_BUILDING_PERMIT_DOCS
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
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

export class MemStorage implements IStorage {
  private packages: Map<number, PermitPackage>;
  private documents: Map<number, PackageDocument>;
  private users: Map<string, User>;
  private settings: Map<string, Setting>;
  private currentPackageId: number;
  private currentDocumentId: number;

  constructor() {
    this.packages = new Map();
    this.documents = new Map();
    this.users = new Map();
    this.settings = new Map();
    this.currentPackageId = 1;
    this.currentDocumentId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  // User management methods (stub implementations)
  async getUser(id: string): Promise<User | undefined> { return undefined; }
  async getUserByEmail(email: string): Promise<User | undefined> { return undefined; }
  async upsertUser(userData: UpsertUser): Promise<User> { 
    return { 
      id: '1', 
      email: userData.email || '', 
      passwordHash: userData.passwordHash || '',
      firstName: userData.firstName || '', 
      lastName: userData.lastName || '', 
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || 'user', 
      isActive: userData.isActive || true, 
      approvalStatus: userData.approvalStatus || 'approved',
      approvedBy: userData.approvedBy || null,
      approvedAt: userData.approvedAt || null,
      rejectionReason: userData.rejectionReason || null,
      company: userData.company || null,
      phone: userData.phone || null,
      lastLoginAt: userData.lastLoginAt || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    }; 
  }
  async getAllUsers(): Promise<User[]> { return []; }
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> { return undefined; }

  // Settings methods (stub implementations)
  async getSetting(key: string): Promise<Setting | undefined> { return undefined; }
  async getAllSettings(): Promise<Setting[]> { return []; }
  async getSettingsByCategory(category: string): Promise<Setting[]> { return []; }
  async upsertSetting(settingData: InsertSetting): Promise<Setting> { 
    return { id: 1, key: settingData.key, value: settingData.value, description: '', category: 'general', isSystem: false, updatedBy: '', updatedAt: new Date() }; 
  }
  async updateSetting(id: number, updates: UpdateSetting): Promise<Setting | undefined> { return undefined; }

  private initializeSampleData() {
    // Create sample packages
    const samplePackages = [
      {
        projectName: "Downtown Office Complex - Phase 1",
        address: "123 Main Street, Downtown",
        permitType: "Building Permit",
        status: "in_progress",
        description: "New construction of 5-story office building",
        clientName: "ABC Development Corp",
        clientEmail: "contact@abcdev.com",
        clientPhone: "(555) 123-4567",
        estimatedValue: 250000000, // $2.5M in cents
      },
      {
        projectName: "Residential Renovation - Smith Property",
        address: "456 Oak Avenue, Suburb",
        permitType: "Building Permit", 
        status: "ready_to_submit",
        description: "Kitchen and bathroom renovation",
        clientName: "John Smith",
        clientEmail: "john.smith@email.com",
        clientPhone: "(555) 987-6543",
        estimatedValue: 7500000, // $75K in cents
      },
      {
        projectName: "Industrial Warehouse Expansion",
        address: "789 Industrial Blvd, Industrial District",
        permitType: "Building Permit",
        status: "draft",
        description: "Warehouse expansion and loading dock addition",
        clientName: "Industrial Solutions LLC",
        clientEmail: "permits@industrialsolutions.com",
        clientPhone: "(555) 456-7890",
        estimatedValue: 150000000, // $1.5M in cents
      }
    ];

    samplePackages.forEach(packageData => {
      const pkg = this.createPackageSync(packageData);
      
      // Add default documents for building permits
      if (packageData.permitType === "Building Permit") {
        DEFAULT_BUILDING_PERMIT_DOCS.forEach((docTemplate, index) => {
          const completedCount = packageData.status === "ready_to_submit" ? 
            DEFAULT_BUILDING_PERMIT_DOCS.length : 
            packageData.status === "in_progress" ? 
              Math.floor(DEFAULT_BUILDING_PERMIT_DOCS.length / 2) : 
              2;
          
          this.createDocumentSync({
            packageId: pkg.id,
            documentName: docTemplate.documentName,
            isRequired: docTemplate.isRequired,
            isCompleted: index < completedCount ? 1 : 0,
          });
        });
      }
    });
  }

  private createPackageSync(packageData: InsertPermitPackage): PermitPackage {
    const id = this.currentPackageId++;
    const now = new Date();
    const pkg: PermitPackage = {
      id,
      projectName: packageData.projectName,
      address: packageData.address,
      permitType: packageData.permitType,
      status: packageData.status || 'draft',
      description: packageData.description || null,
      clientName: packageData.clientName || null,
      clientEmail: packageData.clientEmail || null,
      clientPhone: packageData.clientPhone || null,
      estimatedValue: packageData.estimatedValue || null,
      createdBy: packageData.createdBy || null,
      assignedTo: packageData.assignedTo || null,
      createdAt: now,
      updatedAt: now,
      submittedAt: packageData.status === PACKAGE_STATUSES.SUBMITTED ? now : null,
    };
    this.packages.set(id, pkg);
    return pkg;
  }

  private createDocumentSync(documentData: InsertDocument): PackageDocument {
    const id = this.currentDocumentId++;
    const doc: PackageDocument = {
      id,
      packageId: documentData.packageId,
      documentName: documentData.documentName,
      isRequired: documentData.isRequired || 0,
      isCompleted: documentData.isCompleted || 0,
      fileName: documentData.fileName || null,
      fileSize: documentData.fileSize || null,
      filePath: documentData.filePath || null,
      mimeType: documentData.mimeType || null,
      uploadedAt: documentData.isCompleted ? new Date() : null,
      notes: documentData.notes || null,
    };
    this.documents.set(id, doc);
    return doc;
  }

  async getPackage(id: number): Promise<PermitPackage | undefined> {
    return this.packages.get(id);
  }

  async getPackageWithDocuments(id: number): Promise<PackageWithDocuments | undefined> {
    const pkg = this.packages.get(id);
    if (!pkg) return undefined;

    const documents = Array.from(this.documents.values())
      .filter(doc => doc.packageId === id);
    
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
    const packages = Array.from(this.packages.values());
    const packagesWithDocuments = await Promise.all(
      packages.map(async (pkg) => {
        const result = await this.getPackageWithDocuments(pkg.id);
        return result!;
      })
    );
    
    // Sort by creation date, newest first
    return packagesWithDocuments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createPackage(packageData: InsertPermitPackage): Promise<PermitPackage> {
    return this.createPackageSync(packageData);
  }

  async updatePackage(id: number, updates: UpdatePermitPackage): Promise<PermitPackage | undefined> {
    const pkg = this.packages.get(id);
    if (!pkg) return undefined;

    const updatedPackage: PermitPackage = {
      ...pkg,
      ...updates,
      updatedAt: new Date(),
      submittedAt: updates.status === PACKAGE_STATUSES.SUBMITTED ? new Date() : pkg.submittedAt,
    };

    this.packages.set(id, updatedPackage);
    return updatedPackage;
  }

  async deletePackage(id: number): Promise<boolean> {
    const deleted = this.packages.delete(id);
    if (deleted) {
      // Also delete associated documents
      const documents = Array.from(this.documents.entries())
        .filter(([_, doc]) => doc.packageId === id);
      documents.forEach(([docId]) => this.documents.delete(docId));
    }
    return deleted;
  }

  async getPackageDocuments(packageId: number): Promise<PackageDocument[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.packageId === packageId);
  }

  async getDocument(id: number): Promise<PackageDocument | undefined> {
    return this.documents.get(id);
  }

  async createDocument(documentData: InsertDocument): Promise<PackageDocument> {
    return this.createDocumentSync(documentData);
  }

  async updateDocument(id: number, updates: UpdateDocument): Promise<PackageDocument | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    const updatedDocument: PackageDocument = {
      ...doc,
      ...updates,
      uploadedAt: updates.isCompleted === 1 ? new Date() : doc.uploadedAt,
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
      draft: packages.filter(p => p.status === PACKAGE_STATUSES.DRAFT).length,
      inProgress: packages.filter(p => p.status === PACKAGE_STATUSES.IN_PROGRESS).length,
      readyToSubmit: packages.filter(p => p.status === PACKAGE_STATUSES.READY_TO_SUBMIT).length,
      submitted: packages.filter(p => p.status === PACKAGE_STATUSES.SUBMITTED).length,
    };
  }
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();
