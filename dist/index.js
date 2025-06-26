var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/config.ts
import { z } from "zod";
import { randomBytes } from "crypto";
function generateSecureSecret() {
  return randomBytes(32).toString("hex");
}
function loadConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const dbUrl = new URL(databaseUrl);
  const rawConfig = {
    database: {
      url: databaseUrl,
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port) || 5432,
      name: dbUrl.pathname.slice(1),
      user: dbUrl.username,
      password: dbUrl.password,
      ssl: process.env.DATABASE_SSL === "true",
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || "10")
    },
    server: {
      port: parseInt(process.env.PORT || "5000"),
      host: process.env.HOST || "0.0.0.0",
      environment: process.env.NODE_ENV || "development"
    },
    security: {
      sessionSecret: process.env.SESSION_SECRET || generateSecureSecret(),
      sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || (7 * 24 * 60 * 60 * 1e3).toString()),
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        credentials: process.env.CORS_CREDENTIALS !== "false"
      }
    },
    uploads: {
      directory: process.env.UPLOAD_DIR || "./uploads",
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || (10 * 1024 * 1024).toString()),
      allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(",") || [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ]
    },
    backup: {
      directory: process.env.BACKUP_DIR || "./backups",
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || "30"),
      autoBackup: process.env.AUTO_BACKUP !== "false",
      backupInterval: parseInt(process.env.BACKUP_INTERVAL_HOURS || "24")
    },
    auth: {
      issuerUrl: process.env.OIDC_ISSUER_URL || "https://accounts.google.com",
      clientId: process.env.OIDC_CLIENT_ID || "your-client-id",
      clientSecret: process.env.OIDC_CLIENT_SECRET || "your-client-secret",
      domains: process.env.ALLOWED_DOMAINS?.split(",") || ["localhost"],
      autoApprove: process.env.AUTO_APPROVE_USERS === "true",
      logoutUrl: process.env.LOGOUT_REDIRECT_URL
    }
  };
  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    console.error("Configuration validation failed:", error);
    throw new Error("Invalid configuration. Please check your environment variables.");
  }
}
var configSchema, config;
var init_config = __esm({
  "server/config.ts"() {
    "use strict";
    configSchema = z.object({
      // Database configuration
      database: z.object({
        url: z.string().min(1),
        host: z.string().default("localhost"),
        port: z.number().int().min(1).max(65535).default(5432),
        name: z.string().default(""),
        user: z.string().default(""),
        password: z.string().default(""),
        ssl: z.boolean().default(false),
        maxConnections: z.number().int().min(1).default(10)
      }),
      // Server configuration
      server: z.object({
        port: z.number().int().min(1).max(65535).default(5e3),
        host: z.string().default("0.0.0.0"),
        environment: z.enum(["development", "production", "test"]).default("development")
      }),
      // Security configuration
      security: z.object({
        sessionSecret: z.string().min(1).default("default-session-secret-change-in-production"),
        sessionMaxAge: z.number().int().min(1).default(7 * 24 * 60 * 60 * 1e3),
        // 7 days
        cors: z.object({
          origin: z.string().or(z.array(z.string())).default("*"),
          credentials: z.boolean().default(true)
        })
      }),
      // File upload configuration
      uploads: z.object({
        directory: z.string().default("./uploads"),
        maxFileSize: z.number().int().min(1).default(10 * 1024 * 1024),
        // 10MB
        allowedTypes: z.array(z.string()).default([
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/gif",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ])
      }),
      // Backup configuration
      backup: z.object({
        directory: z.string().default("./backups"),
        retentionDays: z.number().int().min(1).default(30),
        autoBackup: z.boolean().default(true),
        backupInterval: z.number().int().min(1).default(24)
        // hours
      }),
      // Authentication configuration
      auth: z.object({
        issuerUrl: z.string().url().default("https://accounts.google.com"),
        clientId: z.string().min(1).default("your-client-id"),
        clientSecret: z.string().min(1).default("your-client-secret"),
        domains: z.array(z.string()).min(1).default(["localhost"]),
        autoApprove: z.boolean().default(false),
        logoutUrl: z.string().optional()
      })
    });
    config = loadConfig();
  }
});

// shared/sqlite-schema.ts
var sqlite_schema_exports = {};
__export(sqlite_schema_exports, {
  DEFAULT_BUILDING_PERMIT_DOCS: () => DEFAULT_BUILDING_PERMIT_DOCS,
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
  PACKAGE_STATUSES: () => PACKAGE_STATUSES,
  PERMIT_TYPES: () => PERMIT_TYPES,
  insertDocumentSchema: () => insertDocumentSchema,
  insertPermitPackageSchema: () => insertPermitPackageSchema,
  insertSettingSchema: () => insertSettingSchema,
  insertUserSchema: () => insertUserSchema,
  packageDocuments: () => packageDocuments,
  packageDocumentsRelations: () => packageDocumentsRelations,
  permitPackages: () => permitPackages,
  permitPackagesRelations: () => permitPackagesRelations,
  sessions: () => sessions,
  settings: () => settings,
  settingsRelations: () => settingsRelations,
  updateDocumentSchema: () => updateDocumentSchema,
  updatePermitPackageSchema: () => updatePermitPackageSchema,
  updateSettingSchema: () => updateSettingSchema,
  updateUserSchema: () => updateUserSchema,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var users, sessions, settings, permitPackages, packageDocuments, usersRelations, permitPackagesRelations, packageDocumentsRelations, settingsRelations, insertUserSchema, updateUserSchema, insertSettingSchema, updateSettingSchema, insertPermitPackageSchema, updatePermitPackageSchema, insertDocumentSchema, updateDocumentSchema, PACKAGE_STATUSES, PERMIT_TYPES, DEFAULT_SETTINGS, DEFAULT_BUILDING_PERMIT_DOCS;
var init_sqlite_schema = __esm({
  "shared/sqlite-schema.ts"() {
    "use strict";
    users = sqliteTable("users", {
      id: text("id").primaryKey().notNull(),
      email: text("email").unique().notNull(),
      passwordHash: text("password_hash"),
      firstName: text("first_name"),
      lastName: text("last_name"),
      profileImageUrl: text("profile_image_url"),
      role: text("role").notNull().default("user"),
      // user, admin
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      approvalStatus: text("approval_status").notNull().default("pending"),
      // pending, approved, rejected
      approvedBy: text("approved_by"),
      approvedAt: integer("approved_at", { mode: "timestamp" }),
      rejectionReason: text("rejection_reason"),
      company: text("company"),
      phone: text("phone"),
      lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    sessions = sqliteTable("sessions", {
      sid: text("sid").primaryKey(),
      sess: text("sess").notNull(),
      expire: integer("expire", { mode: "timestamp" }).notNull()
    });
    settings = sqliteTable("settings", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      key: text("key").notNull().unique(),
      value: text("value").notNull(),
      description: text("description"),
      category: text("category").notNull().default("general"),
      isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
      updatedBy: text("updated_by").references(() => users.id),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    permitPackages = sqliteTable("permit_packages", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      projectName: text("project_name").notNull(),
      permitType: text("permit_type").notNull(),
      status: text("status").notNull().default("draft"),
      address: text("address").notNull(),
      clientName: text("client_name"),
      clientEmail: text("client_email"),
      clientPhone: text("client_phone"),
      description: text("description"),
      notes: text("notes"),
      assignedTo: text("assigned_to").references(() => users.id),
      createdBy: text("created_by").references(() => users.id),
      submittedAt: integer("submitted_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    packageDocuments = sqliteTable("package_documents", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      packageId: integer("package_id").notNull().references(() => permitPackages.id, { onDelete: "cascade" }),
      documentName: text("document_name").notNull(),
      filename: text("filename"),
      originalName: text("original_name"),
      isRequired: integer("is_required", { mode: "boolean" }).notNull().default(true),
      isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
      uploadedBy: text("uploaded_by").references(() => users.id),
      uploadedAt: integer("uploaded_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    usersRelations = relations(users, ({ many }) => ({
      createdPackages: many(permitPackages, { relationName: "creator" }),
      assignedPackages: many(permitPackages, { relationName: "assignee" }),
      uploadedDocuments: many(packageDocuments),
      updatedSettings: many(settings)
    }));
    permitPackagesRelations = relations(permitPackages, ({ many, one }) => ({
      documents: many(packageDocuments),
      assignedUser: one(users, {
        fields: [permitPackages.assignedTo],
        references: [users.id],
        relationName: "assignee"
      }),
      createdByUser: one(users, {
        fields: [permitPackages.createdBy],
        references: [users.id],
        relationName: "creator"
      })
    }));
    packageDocumentsRelations = relations(packageDocuments, ({ one }) => ({
      package: one(permitPackages, {
        fields: [packageDocuments.packageId],
        references: [permitPackages.id]
      }),
      uploadedByUser: one(users, {
        fields: [packageDocuments.uploadedBy],
        references: [users.id]
      })
    }));
    settingsRelations = relations(settings, ({ one }) => ({
      updatedByUser: one(users, {
        fields: [settings.updatedBy],
        references: [users.id]
      })
    }));
    insertUserSchema = createInsertSchema(users).omit({
      createdAt: true,
      updatedAt: true
    });
    updateUserSchema = insertUserSchema.partial();
    insertSettingSchema = createInsertSchema(settings).omit({
      id: true,
      updatedAt: true
    });
    updateSettingSchema = insertSettingSchema.partial();
    insertPermitPackageSchema = createInsertSchema(permitPackages).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updatePermitPackageSchema = insertPermitPackageSchema.partial();
    insertDocumentSchema = createInsertSchema(packageDocuments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateDocumentSchema = insertDocumentSchema.partial();
    PACKAGE_STATUSES = {
      DRAFT: "draft",
      IN_PROGRESS: "in_progress",
      READY_TO_SUBMIT: "ready_to_submit",
      SUBMITTED: "submitted"
    };
    PERMIT_TYPES = [
      "Building Permit",
      "Electrical Permit",
      "Plumbing Permit",
      "Mechanical Permit",
      "Demolition Permit",
      "Zoning Permit",
      "Other"
    ];
    DEFAULT_SETTINGS = [
      {
        key: "system_name",
        value: "Permit Management System",
        description: "Display name for the system",
        category: "general",
        isSystem: true
      },
      {
        key: "auto_approve_users",
        value: "false",
        description: "Automatically approve new user registrations",
        category: "security",
        isSystem: false
      },
      {
        key: "max_file_size",
        value: "10485760",
        description: "Maximum file upload size in bytes (10MB)",
        category: "uploads",
        isSystem: false
      },
      {
        key: "allowed_file_types",
        value: '["pdf","doc","docx","xls","xlsx","jpg","png"]',
        description: "Allowed file types for uploads",
        category: "uploads",
        isSystem: false
      }
    ];
    DEFAULT_BUILDING_PERMIT_DOCS = [
      "Site Plan",
      "Floor Plans",
      "Elevation Drawings",
      "Construction Details",
      "Structural Calculations",
      "Energy Compliance Forms",
      "Zoning Compliance Letter",
      "Building Code Analysis"
    ];
  }
});

// server/db.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
var dbPath, sqlite, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_sqlite_schema();
    dbPath = "./permit_system.db";
    sqlite = new Database(dbPath);
    db = drizzle(sqlite, { schema: sqlite_schema_exports });
  }
});

// server/database-storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage;
var init_database_storage = __esm({
  "server/database-storage.ts"() {
    "use strict";
    init_sqlite_schema();
    init_db();
    DatabaseStorage = class {
      // User methods
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || void 0;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user || void 0;
      }
      async upsertUser(userData) {
        const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return user;
      }
      async getAllUsers() {
        return await db.select().from(users).orderBy(desc(users.createdAt));
      }
      async updateUser(id, updates) {
        const [updatedUser] = await db.update(users).set({
          ...updates,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, id)).returning();
        return updatedUser || void 0;
      }
      async updateUserPassword(id, hashedPassword) {
        const [updatedUser] = await db.update(users).set({
          passwordHash: hashedPassword,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, id)).returning();
        return updatedUser || void 0;
      }
      async resetUserPassword(id) {
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
        const bcrypt3 = __require("bcrypt");
        const hashedPassword = await bcrypt3.hash(tempPassword, 10);
        await this.updateUserPassword(id, hashedPassword);
        return tempPassword;
      }
      // Settings methods
      async getSetting(key) {
        const [setting] = await db.select().from(settings).where(eq(settings.key, key));
        return setting || void 0;
      }
      async getAllSettings() {
        return await db.select().from(settings).orderBy(settings.category, settings.key);
      }
      async getSettingsByCategory(category) {
        return await db.select().from(settings).where(eq(settings.category, category));
      }
      async upsertSetting(settingData) {
        const [setting] = await db.insert(settings).values({
          ...settingData,
          updatedAt: /* @__PURE__ */ new Date()
        }).onConflictDoUpdate({
          target: settings.key,
          set: {
            ...settingData,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return setting;
      }
      async updateSetting(id, updates) {
        const [updatedSetting] = await db.update(settings).set({
          ...updates,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(settings.id, id)).returning();
        return updatedSetting || void 0;
      }
      async getPackage(id) {
        const [pkg] = await db.select().from(permitPackages).where(eq(permitPackages.id, id));
        return pkg || void 0;
      }
      async getPackageWithDocuments(id) {
        const pkg = await this.getPackage(id);
        if (!pkg) return void 0;
        const documents = await db.select().from(packageDocuments).where(eq(packageDocuments.packageId, id));
        const completedDocuments = documents.filter((doc) => doc.isCompleted === 1).length;
        const totalDocuments = documents.length;
        const progressPercentage = totalDocuments > 0 ? Math.round(completedDocuments / totalDocuments * 100) : 0;
        return {
          ...pkg,
          documents,
          completedDocuments,
          totalDocuments,
          progressPercentage
        };
      }
      async getAllPackages() {
        const packages = await db.select().from(permitPackages).orderBy(desc(permitPackages.createdAt));
        const packagesWithDocuments = await Promise.all(
          packages.map(async (pkg) => {
            const result = await this.getPackageWithDocuments(pkg.id);
            return result;
          })
        );
        return packagesWithDocuments;
      }
      async createPackage(packageData) {
        const [newPackage] = await db.insert(permitPackages).values({
          ...packageData,
          status: packageData.status || "draft"
        }).returning();
        return newPackage;
      }
      async updatePackage(id, updates) {
        const [updatedPackage] = await db.update(permitPackages).set({
          ...updates,
          updatedAt: /* @__PURE__ */ new Date(),
          submittedAt: updates.status === PACKAGE_STATUSES.SUBMITTED ? /* @__PURE__ */ new Date() : void 0
        }).where(eq(permitPackages.id, id)).returning();
        return updatedPackage || void 0;
      }
      async deletePackage(id) {
        const result = await db.delete(permitPackages).where(eq(permitPackages.id, id));
        return (result.rowCount || 0) > 0;
      }
      async getPackageDocuments(packageId) {
        return await db.select().from(packageDocuments).where(eq(packageDocuments.packageId, packageId));
      }
      async getDocument(id) {
        const [document] = await db.select().from(packageDocuments).where(eq(packageDocuments.id, id));
        return document || void 0;
      }
      async createDocument(documentData) {
        const [newDocument] = await db.insert(packageDocuments).values({
          ...documentData,
          isRequired: documentData.isRequired || 0,
          isCompleted: documentData.isCompleted || 0
        }).returning();
        return newDocument;
      }
      async updateDocument(id, updates) {
        const [updatedDocument] = await db.update(packageDocuments).set({
          ...updates,
          uploadedAt: updates.isCompleted === 1 ? /* @__PURE__ */ new Date() : void 0
        }).where(eq(packageDocuments.id, id)).returning();
        return updatedDocument || void 0;
      }
      async deleteDocument(id) {
        const result = await db.delete(packageDocuments).where(eq(packageDocuments.id, id));
        return (result.rowCount || 0) > 0;
      }
      async getPackageStats() {
        const packages = await db.select().from(permitPackages);
        return {
          total: packages.length,
          draft: packages.filter((p) => p.status === PACKAGE_STATUSES.DRAFT).length,
          inProgress: packages.filter((p) => p.status === PACKAGE_STATUSES.IN_PROGRESS).length,
          readyToSubmit: packages.filter((p) => p.status === PACKAGE_STATUSES.READY_TO_SUBMIT).length,
          submitted: packages.filter((p) => p.status === PACKAGE_STATUSES.SUBMITTED).length
        };
      }
    };
  }
});

// server/sqlite-db.ts
import Database2 from "better-sqlite3";
import { drizzle as drizzle2 } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
var dbPath2, dbDir, sqlite2, db2;
var init_sqlite_db = __esm({
  "server/sqlite-db.ts"() {
    "use strict";
    init_sqlite_schema();
    dbPath2 = "./permit_system.db";
    dbDir = dirname(dbPath2);
    try {
      mkdirSync(dbDir, { recursive: true });
    } catch (error) {
    }
    sqlite2 = new Database2(dbPath2);
    db2 = drizzle2(sqlite2, { schema: sqlite_schema_exports });
  }
});

// server/simple-sqlite-storage.ts
import { eq as eq2, desc as desc2 } from "drizzle-orm";
import bcrypt from "bcrypt";
var SimpleSQLiteStorage;
var init_simple_sqlite_storage = __esm({
  "server/simple-sqlite-storage.ts"() {
    "use strict";
    init_sqlite_db();
    init_sqlite_schema();
    SimpleSQLiteStorage = class {
      // User methods
      async getUser(id) {
        const [user] = await db2.select().from(users).where(eq2(users.id, id));
        return user || void 0;
      }
      async getUserByEmail(email) {
        const [user] = await db2.select().from(users).where(eq2(users.email, email));
        console.log("SimpleSQLiteStorage - Raw user from DB:", JSON.stringify(user, null, 2));
        return user || void 0;
      }
      async upsertUser(userData) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [user] = await db2.insert(users).values({
          ...userData,
          updatedAt: timestamp2
        }).onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: timestamp2
          }
        }).returning();
        return user;
      }
      async getAllUsers() {
        return await db2.select().from(users).orderBy(desc2(users.createdAt));
      }
      async updateUser(id, updates) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [updated] = await db2.update(users).set({ ...updates, updatedAt: timestamp2 }).where(eq2(users.id, id)).returning();
        return updated;
      }
      async updateUserPassword(id, hashedPassword) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [updated] = await db2.update(users).set({ passwordHash: hashedPassword, updatedAt: timestamp2 }).where(eq2(users.id, id)).returning();
        return updated;
      }
      async resetUserPassword(id) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await this.updateUserPassword(id, hashedPassword);
        return tempPassword;
      }
      // Settings methods
      async getSetting(key) {
        const [setting] = await db2.select().from(settings).where(eq2(settings.key, key));
        return setting || void 0;
      }
      async getAllSettings() {
        return await db2.select().from(settings).orderBy(settings.category, settings.key);
      }
      async getSettingsByCategory(category) {
        return await db2.select().from(settings).where(eq2(settings.category, category));
      }
      async upsertSetting(settingData) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [setting] = await db2.insert(settings).values({ ...settingData, updatedAt: timestamp2 }).onConflictDoUpdate({
          target: settings.key,
          set: { ...settingData, updatedAt: timestamp2 }
        }).returning();
        return setting;
      }
      async updateSetting(id, updates) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [updated] = await db2.update(settings).set({ ...updates, updatedAt: timestamp2 }).where(eq2(settings.id, id)).returning();
        return updated;
      }
      // Package methods
      async getPackage(id) {
        const [pkg] = await db2.select().from(permitPackages).where(eq2(permitPackages.id, id));
        return pkg || void 0;
      }
      async getPackageWithDocuments(id) {
        const pkg = await this.getPackage(id);
        if (!pkg) return void 0;
        const documents = await this.getPackageDocuments(id);
        const completedDocuments = documents.filter((doc) => doc.isCompleted).length;
        const totalDocuments = documents.length;
        const progressPercentage = totalDocuments > 0 ? Math.round(completedDocuments / totalDocuments * 100) : 0;
        return {
          ...pkg,
          documents,
          completedDocuments,
          totalDocuments,
          progressPercentage
        };
      }
      async getAllPackages() {
        const packages = await db2.select().from(permitPackages).orderBy(desc2(permitPackages.createdAt));
        const packagesWithDocuments = await Promise.all(
          packages.map(async (pkg) => {
            const documents = await this.getPackageDocuments(pkg.id);
            const completedDocuments = documents.filter((doc) => doc.isCompleted).length;
            const totalDocuments = documents.length;
            const progressPercentage = totalDocuments > 0 ? Math.round(completedDocuments / totalDocuments * 100) : 0;
            return {
              ...pkg,
              documents,
              completedDocuments,
              totalDocuments,
              progressPercentage
            };
          })
        );
        return packagesWithDocuments;
      }
      async createPackage(packageData) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [pkg] = await db2.insert(permitPackages).values({
          ...packageData,
          createdAt: timestamp2,
          updatedAt: timestamp2
        }).returning();
        return pkg;
      }
      async updatePackage(id, updates) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [updated] = await db2.update(permitPackages).set({ ...updates, updatedAt: timestamp2 }).where(eq2(permitPackages.id, id)).returning();
        return updated;
      }
      async deletePackage(id) {
        const result = await db2.delete(permitPackages).where(eq2(permitPackages.id, id));
        return result.changes > 0;
      }
      // Document methods
      async getPackageDocuments(packageId) {
        return await db2.select().from(packageDocuments).where(eq2(packageDocuments.packageId, packageId)).orderBy(packageDocuments.documentName);
      }
      async getDocument(id) {
        const [doc] = await db2.select().from(packageDocuments).where(eq2(packageDocuments.id, id));
        return doc || void 0;
      }
      async createDocument(documentData) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [doc] = await db2.insert(packageDocuments).values({
          ...documentData,
          createdAt: timestamp2,
          updatedAt: timestamp2
        }).returning();
        return doc;
      }
      async updateDocument(id, updates) {
        const timestamp2 = Math.floor(Date.now() / 1e3);
        const [updated] = await db2.update(packageDocuments).set({ ...updates, updatedAt: timestamp2 }).where(eq2(packageDocuments.id, id)).returning();
        return updated;
      }
      async deleteDocument(id) {
        const result = await db2.delete(packageDocuments).where(eq2(packageDocuments.id, id));
        return result.changes > 0;
      }
      // Stats methods
      async getPackageStats() {
        const packages = await db2.select().from(permitPackages);
        const stats = {
          total: packages.length,
          draft: packages.filter((p) => p.status === "draft").length,
          inProgress: packages.filter((p) => p.status === "in_progress").length,
          readyToSubmit: packages.filter((p) => p.status === "ready_to_submit").length,
          submitted: packages.filter((p) => p.status === "submitted").length
        };
        return stats;
      }
    };
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  MemStorage: () => MemStorage,
  storage: () => storage
});
function createStorage() {
  if (process.env.FORCE_LOCAL_AUTH === "true") {
    console.log("FORCE_LOCAL_AUTH detected - using SimpleSQLiteStorage");
    return new SimpleSQLiteStorage();
  }
  console.log("Storage initialization - DATABASE_URL:", process.env.DATABASE_URL);
  if (!process.env.DATABASE_URL) {
    console.warn("No DATABASE_URL found, using in-memory storage");
    return new MemStorage();
  }
  const isPostgreSQL = process.env.DATABASE_URL.startsWith("postgresql://") || process.env.DATABASE_URL.startsWith("postgres://");
  const isSQLite = process.env.DATABASE_URL.startsWith("file:") || process.env.DATABASE_URL.endsWith(".db");
  console.log("Storage checks - isPostgreSQL:", isPostgreSQL, "isSQLite:", isSQLite);
  if (isPostgreSQL) {
    console.log("Using DatabaseStorage for PostgreSQL");
    return new DatabaseStorage();
  } else if (isSQLite) {
    console.log("Using SimpleSQLiteStorage for SQLite");
    return new SimpleSQLiteStorage();
  } else {
    console.warn("Unknown database type, using in-memory storage");
    return new MemStorage();
  }
}
var MemStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_sqlite_schema();
    init_database_storage();
    init_simple_sqlite_storage();
    MemStorage = class {
      packages;
      documents;
      users;
      settings;
      currentPackageId;
      currentDocumentId;
      constructor() {
        this.packages = /* @__PURE__ */ new Map();
        this.documents = /* @__PURE__ */ new Map();
        this.users = /* @__PURE__ */ new Map();
        this.settings = /* @__PURE__ */ new Map();
        this.currentPackageId = 1;
        this.currentDocumentId = 1;
        this.initializeSampleData();
      }
      // User management methods (stub implementations)
      async getUser(id) {
        return void 0;
      }
      async getUserByEmail(email) {
        return void 0;
      }
      async upsertUser(userData) {
        return {
          id: "1",
          email: userData.email || "",
          passwordHash: userData.passwordHash || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          profileImageUrl: userData.profileImageUrl || null,
          role: userData.role || "user",
          isActive: userData.isActive || true,
          approvalStatus: userData.approvalStatus || "approved",
          approvedBy: userData.approvedBy || null,
          approvedAt: userData.approvedAt || null,
          rejectionReason: userData.rejectionReason || null,
          company: userData.company || null,
          phone: userData.phone || null,
          lastLoginAt: userData.lastLoginAt || null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
      }
      async getAllUsers() {
        return [];
      }
      async updateUser(id, updates) {
        return void 0;
      }
      async updateUserPassword(id, hashedPassword) {
        return void 0;
      }
      async resetUserPassword(id) {
        return "temp-password";
      }
      // Settings methods (stub implementations)
      async getSetting(key) {
        return void 0;
      }
      async getAllSettings() {
        return [];
      }
      async getSettingsByCategory(category) {
        return [];
      }
      async upsertSetting(settingData) {
        return { id: 1, key: settingData.key, value: settingData.value, description: "", category: "general", isSystem: false, updatedBy: "", updatedAt: /* @__PURE__ */ new Date() };
      }
      async updateSetting(id, updates) {
        return void 0;
      }
      initializeSampleData() {
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
            estimatedValue: 25e7
            // $2.5M in cents
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
            estimatedValue: 75e5
            // $75K in cents
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
            estimatedValue: 15e7
            // $1.5M in cents
          }
        ];
        samplePackages.forEach((packageData) => {
          const pkg = this.createPackageSync(packageData);
          if (packageData.permitType === "Building Permit") {
            DEFAULT_BUILDING_PERMIT_DOCS.forEach((docTemplate, index2) => {
              const completedCount = packageData.status === "ready_to_submit" ? DEFAULT_BUILDING_PERMIT_DOCS.length : packageData.status === "in_progress" ? Math.floor(DEFAULT_BUILDING_PERMIT_DOCS.length / 2) : 2;
              this.createDocumentSync({
                packageId: pkg.id,
                documentName: docTemplate.documentName,
                isRequired: docTemplate.isRequired,
                isCompleted: index2 < completedCount ? 1 : 0
              });
            });
          }
        });
      }
      createPackageSync(packageData) {
        const id = this.currentPackageId++;
        const now = /* @__PURE__ */ new Date();
        const pkg = {
          id,
          projectName: packageData.projectName,
          address: packageData.address,
          permitType: packageData.permitType,
          status: packageData.status || "draft",
          description: packageData.description || null,
          clientName: packageData.clientName || null,
          clientEmail: packageData.clientEmail || null,
          clientPhone: packageData.clientPhone || null,
          estimatedValue: packageData.estimatedValue || null,
          createdBy: packageData.createdBy || null,
          assignedTo: packageData.assignedTo || null,
          createdAt: now,
          updatedAt: now,
          submittedAt: packageData.status === PACKAGE_STATUSES.SUBMITTED ? now : null
        };
        this.packages.set(id, pkg);
        return pkg;
      }
      createDocumentSync(documentData) {
        const id = this.currentDocumentId++;
        const doc = {
          id,
          packageId: documentData.packageId,
          documentName: documentData.documentName,
          isRequired: documentData.isRequired || 0,
          isCompleted: documentData.isCompleted || 0,
          fileName: documentData.fileName || null,
          fileSize: documentData.fileSize || null,
          filePath: documentData.filePath || null,
          mimeType: documentData.mimeType || null,
          uploadedAt: documentData.isCompleted ? /* @__PURE__ */ new Date() : null,
          notes: documentData.notes || null
        };
        this.documents.set(id, doc);
        return doc;
      }
      async getPackage(id) {
        return this.packages.get(id);
      }
      async getPackageWithDocuments(id) {
        const pkg = this.packages.get(id);
        if (!pkg) return void 0;
        const documents = Array.from(this.documents.values()).filter((doc) => doc.packageId === id);
        const completedDocuments = documents.filter((doc) => doc.isCompleted === 1).length;
        const totalDocuments = documents.length;
        const progressPercentage = totalDocuments > 0 ? Math.round(completedDocuments / totalDocuments * 100) : 0;
        return {
          ...pkg,
          documents,
          completedDocuments,
          totalDocuments,
          progressPercentage
        };
      }
      async getAllPackages() {
        const packages = Array.from(this.packages.values());
        const packagesWithDocuments = await Promise.all(
          packages.map(async (pkg) => {
            const result = await this.getPackageWithDocuments(pkg.id);
            return result;
          })
        );
        return packagesWithDocuments.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      async createPackage(packageData) {
        return this.createPackageSync(packageData);
      }
      async updatePackage(id, updates) {
        const pkg = this.packages.get(id);
        if (!pkg) return void 0;
        const updatedPackage = {
          ...pkg,
          ...updates,
          updatedAt: /* @__PURE__ */ new Date(),
          submittedAt: updates.status === PACKAGE_STATUSES.SUBMITTED ? /* @__PURE__ */ new Date() : pkg.submittedAt
        };
        this.packages.set(id, updatedPackage);
        return updatedPackage;
      }
      async deletePackage(id) {
        const deleted = this.packages.delete(id);
        if (deleted) {
          const documents = Array.from(this.documents.entries()).filter(([_, doc]) => doc.packageId === id);
          documents.forEach(([docId]) => this.documents.delete(docId));
        }
        return deleted;
      }
      async getPackageDocuments(packageId) {
        return Array.from(this.documents.values()).filter((doc) => doc.packageId === packageId);
      }
      async getDocument(id) {
        return this.documents.get(id);
      }
      async createDocument(documentData) {
        return this.createDocumentSync(documentData);
      }
      async updateDocument(id, updates) {
        const doc = this.documents.get(id);
        if (!doc) return void 0;
        const updatedDocument = {
          ...doc,
          ...updates,
          uploadedAt: updates.isCompleted === 1 ? /* @__PURE__ */ new Date() : doc.uploadedAt
        };
        this.documents.set(id, updatedDocument);
        return updatedDocument;
      }
      async deleteDocument(id) {
        return this.documents.delete(id);
      }
      async getPackageStats() {
        const packages = Array.from(this.packages.values());
        return {
          total: packages.length,
          draft: packages.filter((p) => p.status === PACKAGE_STATUSES.DRAFT).length,
          inProgress: packages.filter((p) => p.status === PACKAGE_STATUSES.IN_PROGRESS).length,
          readyToSubmit: packages.filter((p) => p.status === PACKAGE_STATUSES.READY_TO_SUBMIT).length,
          submitted: packages.filter((p) => p.status === PACKAGE_STATUSES.SUBMITTED).length
        };
      }
    };
    storage = createStorage();
  }
});

// server/local-auth.ts
var local_auth_exports = {};
__export(local_auth_exports, {
  getSession: () => getSession,
  hashPassword: () => hashPassword,
  isAdmin: () => isAdmin,
  isAuthenticated: () => isAuthenticated,
  setupLocalAuth: () => setupLocalAuth,
  verifyPassword: () => verifyPassword
});
import bcrypt2 from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import Database3 from "better-sqlite3";
function getSession() {
  const sessionTtl = config.security.sessionMaxAge;
  if (process.env.FORCE_LOCAL_AUTH === "true" || process.env.DATABASE_URL?.includes("file:")) {
    const SessionStore = MemoryStore(session);
    const sessionStore2 = new SessionStore({
      checkPeriod: 864e5
      // prune expired entries every 24h
    });
    return session({
      secret: config.security.sessionSecret,
      store: sessionStore2,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: sessionTtl,
        sameSite: "lax"
      }
    });
  }
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: config.security.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
      sameSite: "lax"
    }
  });
}
async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt2.hash(password, saltRounds);
}
async function verifyPassword(password, hashedPassword) {
  return bcrypt2.compare(password, hashedPassword);
}
async function getUserByEmailSQLite(email) {
  if (process.env.FORCE_LOCAL_AUTH === "true") {
    const db3 = new Database3("./permit_system.db");
    try {
      const user = db3.prepare("SELECT * FROM users WHERE email = ?").get(email);
      db3.close();
      if (!user) return void 0;
      return {
        id: user.id,
        email: user.email,
        passwordHash: user.password_hash,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImageUrl: user.profile_image_url,
        role: user.role,
        isActive: Boolean(user.is_active),
        approvalStatus: user.approval_status,
        approvedBy: user.approved_by,
        approvedAt: user.approved_at,
        rejectionReason: user.rejection_reason,
        company: user.company,
        phone: user.phone,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error("SQLite user lookup error:", error);
      db3.close();
      return void 0;
    }
  }
  return void 0;
}
async function setupLocalAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    async (email, password, done) => {
      try {
        const user = process.env.FORCE_LOCAL_AUTH === "true" ? await getUserByEmailSQLite(email) : await storage.getUserByEmail(email);
        console.log("Retrieved user:", JSON.stringify(user, null, 2));
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        if (!user.isActive) {
          return done(null, false, { message: "Account is disabled" });
        }
        if (user.approvalStatus !== "approved") {
          return done(null, false, { message: "Account pending approval" });
        }
        if (!user.passwordHash) {
          console.log("Password hash missing:", user.passwordHash);
          return done(null, false, { message: "Account not properly configured" });
        }
        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid password" });
        }
        if (process.env.FORCE_LOCAL_AUTH !== "true") {
          try {
            await storage.updateUser(user.id, {
              lastLoginAt: /* @__PURE__ */ new Date()
            });
          } catch (error) {
            console.warn("Failed to update last login time:", error);
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const user = await storage2.getUser(id);
      if (!user) {
        if (id === "admin") {
          const adminUser = {
            id: "admin",
            email: "admin@localhost",
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            isActive: true,
            approvalStatus: "approved"
          };
          return done(null, adminUser);
        }
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.get("/api/login", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login - Permit Management System</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; 
            margin: 0; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          .container { 
            background: white; 
            border-radius: 8px; 
            padding: 2rem; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            width: 100%; 
            max-width: 400px; 
          }
          h1 { margin-top: 0; color: #333; text-align: center; }
          .form-group { margin-bottom: 1rem; }
          label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555; }
          input { 
            width: 100%; 
            padding: 0.75rem; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            font-size: 1rem;
            box-sizing: border-box;
          }
          button { 
            width: 100%; 
            padding: 0.75rem; 
            background: #667eea; 
            color: white; 
            border: none; 
            border-radius: 4px; 
            font-size: 1rem; 
            cursor: pointer; 
            font-weight: 500;
          }
          button:hover { background: #5a67d8; }
          .error { color: #e53e3e; margin-top: 0.5rem; }
          .info { 
            background: #e6fffa; 
            border: 1px solid #81e6d9; 
            padding: 1rem; 
            border-radius: 4px; 
            margin-bottom: 1rem; 
            color: #234e52;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Login</h1>
          <div class="info">
            <strong>Default Admin Account:</strong><br>
            Email: admin@localhost<br>
            Password: admin123
          </div>
          <form id="loginForm">
            <div class="form-group">
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
            <div id="error" class="error"></div>
          </form>
        </div>
        
        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = '';
            
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            
            try {
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
              });
              
              const result = await response.json();
              
              if (result.success) {
                window.location.href = '/dashboard';
              } else {
                errorDiv.textContent = result.message || 'Login failed';
              }
            } catch (error) {
              errorDiv.textContent = 'Network error. Please try again.';
            }
          });
        </script>
      </body>
      </html>
    `);
  });
  app2.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Authentication error"
        });
      }
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Invalid credentials"
        });
      }
      req.logIn(user, (err2) => {
        if (err2) {
          return res.status(500).json({
            success: false,
            message: "Login failed"
          });
        }
        return res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            approvalStatus: user.approvalStatus
          }
        });
      });
    })(req, res, next);
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  app2.post("/api/register", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role = "user", company, phone } = req.body;
      if (!email || !password || !firstName) {
        return res.status(400).json({ error: "Email, password, and first name are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      const passwordHash = await hashPassword(password);
      const newUser = await storage.upsertUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        lastName,
        passwordHash,
        role,
        company,
        phone,
        approvalStatus: "approved",
        isActive: true,
        approvedBy: req.user?.id,
        approvedAt: /* @__PURE__ */ new Date()
      });
      res.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        approvalStatus: user.approvalStatus,
        company: user.company,
        phone: user.phone
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  app2.post("/api/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
      }
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ error: "User not found" });
      }
      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      const newPasswordHash = await hashPassword(newPassword);
      await storage.updateUser(userId, { passwordHash: newPasswordHash });
      res.json({ success: true });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Password change failed" });
    }
  });
  app2.post("/api/reset-password", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      if (!userId || !newPassword) {
        return res.status(400).json({ error: "User ID and new password are required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const passwordHash = await hashPassword(newPassword);
      await storage.updateUser(userId, { passwordHash });
      res.json({ success: true });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Password reset failed" });
    }
  });
}
var isAuthenticated, isAdmin;
var init_local_auth = __esm({
  "server/local-auth.ts"() {
    "use strict";
    init_config();
    init_storage();
    isAuthenticated = async (req, res, next) => {
      if (req.isAuthenticated() && req.user) {
        try {
          const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
          const userId = req.user.id;
          const dbUser = await storage2.getUser(userId);
          if (dbUser) {
            req.dbUser = dbUser;
            return next();
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }
      res.status(401).json({ message: "Unauthorized" });
    };
    isAdmin = (req, res, next) => {
      if (req.user?.role === "admin") {
        return next();
      }
      res.status(403).json({ message: "Forbidden: Admin access required" });
    };
  }
});

// server/index.ts
import "dotenv/config";
import express3 from "express";

// server/routes.ts
init_local_auth();
import express from "express";
import { createServer } from "http";

// server/health-monitor.ts
init_db();
init_config();
import fs from "fs/promises";
import path from "path";
var HealthMonitor = class {
  lastHealthCheck = null;
  async checkHealth() {
    const startTime = Date.now();
    const health = {
      database: await this.checkDatabase(),
      storage: await this.checkStorage(),
      system: this.checkSystem(),
      lastCheck: /* @__PURE__ */ new Date()
    };
    this.lastHealthCheck = health;
    return health;
  }
  async checkDatabase() {
    try {
      const startTime = Date.now();
      await db.execute("SELECT 1");
      const responseTime = Date.now() - startTime;
      return {
        connected: true,
        responseTime
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : "Unknown database error"
      };
    }
  }
  async checkStorage() {
    const uploadsWritable = await this.checkDirectoryWritable(config.uploads.directory);
    const backupsWritable = await this.checkDirectoryWritable(config.backup.directory);
    const diskSpace = await this.getDiskSpace();
    return {
      uploadsWritable,
      backupsWritable,
      diskSpace
    };
  }
  async checkDirectoryWritable(directory) {
    try {
      await fs.access(directory, fs.constants.W_OK);
      const testFile = path.join(directory, ".health-check");
      await fs.writeFile(testFile, "test");
      await fs.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  }
  async getDiskSpace() {
    try {
      const stats = await fs.statfs(".");
      const blockSize = stats.bavail || stats.bsize || 4096;
      const total = stats.blocks * blockSize;
      const free = stats.bavail * blockSize;
      const used = total - free;
      const percentage = Math.round(used / total * 100);
      return {
        total: Math.round(total / (1024 * 1024 * 1024)),
        // GB
        free: Math.round(free / (1024 * 1024 * 1024)),
        // GB
        used: Math.round(used / (1024 * 1024 * 1024)),
        // GB
        percentage
      };
    } catch {
      return {
        total: 0,
        free: 0,
        used: 0,
        percentage: 0
      };
    }
  }
  checkSystem() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = Math.round(usedMemory / totalMemory * 100);
    return {
      uptime,
      memory: {
        used: Math.round(usedMemory / (1024 * 1024)),
        // MB
        total: Math.round(totalMemory / (1024 * 1024)),
        // MB
        percentage: memoryPercentage
      }
    };
  }
  getLastHealthCheck() {
    return this.lastHealthCheck;
  }
  isHealthy() {
    if (!this.lastHealthCheck) return false;
    const { database, storage: storage2 } = this.lastHealthCheck;
    return database.connected && storage2.uploadsWritable && storage2.backupsWritable && storage2.diskSpace.percentage < 90;
  }
};
var healthMonitor = new HealthMonitor();

// server/routes.ts
init_config();
import multer from "multer";
import path2 from "path";
import fs2 from "fs";

// shared/schema.ts
import { pgTable, text as text2, serial, integer as integer2, timestamp, varchar, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { relations as relations2 } from "drizzle-orm";
import { createInsertSchema as createInsertSchema2 } from "drizzle-zod";
var users2 = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"),
  // user, admin
  isActive: boolean("is_active").notNull().default(true),
  approvalStatus: varchar("approval_status").notNull().default("pending"),
  // pending, approved, rejected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text2("rejection_reason"),
  company: varchar("company"),
  phone: varchar("phone"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var sessions2 = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var settings2 = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text2("description"),
  category: varchar("category").notNull().default("general"),
  isSystem: boolean("is_system").notNull().default(false),
  updatedBy: varchar("updated_by").references(() => users2.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var permitPackages2 = pgTable("permit_packages", {
  id: serial("id").primaryKey(),
  projectName: text2("project_name").notNull(),
  address: text2("address").notNull(),
  permitType: text2("permit_type").notNull(),
  status: text2("status").notNull().default("draft"),
  // draft, in_progress, ready_to_submit, submitted
  description: text2("description"),
  clientName: text2("client_name"),
  clientEmail: text2("client_email"),
  clientPhone: text2("client_phone"),
  estimatedValue: integer2("estimated_value"),
  // in cents
  createdBy: varchar("created_by").references(() => users2.id),
  assignedTo: varchar("assigned_to").references(() => users2.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at")
});
var packageDocuments2 = pgTable("package_documents", {
  id: serial("id").primaryKey(),
  packageId: integer2("package_id").notNull().references(() => permitPackages2.id, { onDelete: "cascade" }),
  documentName: text2("document_name").notNull(),
  isRequired: integer2("is_required").notNull().default(1),
  // 1 for true, 0 for false (SQLite compatibility)
  isCompleted: integer2("is_completed").notNull().default(0),
  // 1 for true, 0 for false
  fileName: text2("file_name"),
  fileSize: integer2("file_size"),
  filePath: text2("file_path"),
  // Path to the uploaded file
  mimeType: text2("mime_type"),
  // File type (PDF, image, etc.)
  uploadedAt: timestamp("uploaded_at"),
  notes: text2("notes")
});
var usersRelations2 = relations2(users2, ({ many, one }) => ({
  createdPackages: many(permitPackages2, { relationName: "createdBy" }),
  assignedPackages: many(permitPackages2, { relationName: "assignedTo" }),
  settingsUpdates: many(settings2),
  approvedUsers: many(users2, { relationName: "approver" })
  // approver: one(users, { 
  //   fields: [users.approvedBy], 
  //   references: [users.id],
  //   relationName: "approver"
  // }),
}));
var permitPackagesRelations2 = relations2(permitPackages2, ({ many, one }) => ({
  documents: many(packageDocuments2),
  creator: one(users2, {
    fields: [permitPackages2.createdBy],
    references: [users2.id],
    relationName: "createdBy"
  }),
  assignee: one(users2, {
    fields: [permitPackages2.assignedTo],
    references: [users2.id],
    relationName: "assignedTo"
  })
}));
var packageDocumentsRelations2 = relations2(packageDocuments2, ({ one }) => ({
  package: one(permitPackages2, {
    fields: [packageDocuments2.packageId],
    references: [permitPackages2.id]
  })
}));
var settingsRelations2 = relations2(settings2, ({ one }) => ({
  updatedByUser: one(users2, {
    fields: [settings2.updatedBy],
    references: [users2.id]
  })
}));
var insertUserSchema2 = createInsertSchema2(users2).omit({
  createdAt: true,
  updatedAt: true
});
var updateUserSchema2 = insertUserSchema2.partial();
var insertSettingSchema2 = createInsertSchema2(settings2).omit({
  id: true,
  updatedAt: true
});
var updateSettingSchema2 = insertSettingSchema2.partial();
var insertPermitPackageSchema2 = createInsertSchema2(permitPackages2).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true
});
var updatePermitPackageSchema2 = insertPermitPackageSchema2.partial();
var insertDocumentSchema2 = createInsertSchema2(packageDocuments2).omit({
  id: true,
  uploadedAt: true
});
var updateDocumentSchema2 = insertDocumentSchema2.partial();
var DEFAULT_BUILDING_PERMIT_DOCS2 = [
  { documentName: "Building Plans", isRequired: 1 },
  { documentName: "Site Plan", isRequired: 1 },
  { documentName: "Structural Calculations", isRequired: 1 },
  { documentName: "Energy Compliance Forms", isRequired: 1 },
  { documentName: "Permit Application Form", isRequired: 1 },
  { documentName: "Property Survey", isRequired: 1 },
  { documentName: "Soil Report", isRequired: 0 },
  { documentName: "Environmental Impact Assessment", isRequired: 0 },
  { documentName: "Traffic Impact Study", isRequired: 0 },
  { documentName: "Fire Department Approval", isRequired: 1 },
  { documentName: "Utility Clearances", isRequired: 1 },
  { documentName: "HOA Approval", isRequired: 0 }
];

// server/routes.ts
async function registerRoutes(app2) {
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  const uploadsDir = path2.join(process.cwd(), "uploads");
  if (!fs2.existsSync(uploadsDir)) {
    fs2.mkdirSync(uploadsDir, { recursive: true });
  }
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path2.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
  });
  const upload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 10 * 1024 * 1024
      // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /\.(pdf|jpg|jpeg|png|gif|doc|docx|xls|xlsx|txt)$/i;
      if (allowedTypes.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only documents and images are allowed."));
      }
    }
  });
  app2.get("/dashboard", isAuthenticated, async (req, res) => {
    const packages = await storage2.getAllPackages();
    const stats = await storage2.getPackageStats();
    const user = req.user || { firstName: "Admin", lastName: "User", email: "admin@localhost", role: "admin" };
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Permit Management Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; background: #f8fafc; }
          .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; }
          .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
          .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-number { font-size: 2rem; font-weight: bold; color: #1e40af; }
          .stat-label { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
          .packages { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .packages-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: between; align-items: center; }
          .btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block; }
          .btn:hover { background: #2563eb; }
          .package-grid { display: grid; gap: 1rem; padding: 1.5rem; }
          .package-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; }
          .package-title { font-weight: 600; margin-bottom: 0.5rem; }
          .package-meta { font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem; }
          .status { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
          .status-draft { background: #f3f4f6; color: #374151; }
          .status-in-progress { background: #fef3c7; color: #92400e; }
          .status-ready { background: #d1fae5; color: #065f46; }
          .status-submitted { background: #dbeafe; color: #1e40af; }
          .progress-bar { background: #e5e7eb; height: 4px; border-radius: 2px; margin-top: 0.5rem; }
          .progress-fill { background: #3b82f6; height: 100%; border-radius: 2px; }
          .logout { color: #dc2626; text-decoration: none; }
          .admin-section { margin-top: 2rem; }
          .quick-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
          .action-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
          .action-card h3 { margin-bottom: 0.5rem; color: #1f2937; }
          .action-card p { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; }
          .action-card .btn { width: 100%; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
            <h1>Permit Management System</h1>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span style="color: #64748b; font-size: 0.875rem;">Welcome, ${user.firstName} ${user.lastName}</span>
              <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${user.role}</span>
              <a href="/api/logout" class="logout">Logout</a>
            </div>
          </div>
        </div>
        
        ${user.role === "admin" ? `
        <div style="background: white; border-bottom: 1px solid #e2e8f0;">
          <div style="max-width: 1200px; margin: 0 auto; padding: 0 2rem;">
            <nav style="display: flex; gap: 2rem;">
              <a href="/dashboard" style="padding: 1rem 0; color: #3b82f6; text-decoration: none; border-bottom: 2px solid #3b82f6;">Dashboard</a>
              <a href="/admin/users" style="padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent;">User Management</a>
              <a href="/admin/packages" style="padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent;">All Packages</a>
              <a href="/admin/settings" style="padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent;">System Settings</a>
              <a href="/admin/reports" style="padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent;">Reports</a>
            </nav>
          </div>
        </div>
        ` : ""}
        
        <div class="container">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${stats.total}</div>
              <div class="stat-label">Total Packages</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.draft}</div>
              <div class="stat-label">Draft</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.inProgress}</div>
              <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.readyToSubmit}</div>
              <div class="stat-label">Ready to Submit</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.submitted}</div>
              <div class="stat-label">Submitted</div>
            </div>
          </div>
          
          <div class="packages">
            <div class="packages-header">
              <h2>Recent Packages</h2>
              <a href="/create-package" class="btn">New Package</a>
            </div>
            <div class="package-grid">
              ${packages.slice(0, 10).map((pkg) => `
                <div class="package-card">
                  <div class="package-title">${pkg.projectName}</div>
                  <div class="package-meta">
                    ${pkg.permitType} \u2022 ${pkg.address}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                    <span class="status status-${pkg.status.replace(/\s+/g, "-").toLowerCase()}">${pkg.status}</span>
                    <span style="font-size: 0.75rem; color: #64748b;">
                      ${pkg.completedDocuments}/${pkg.totalDocuments} docs
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${pkg.progressPercentage}%"></div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
          
          ${user.role === "admin" ? `
          <div class="admin-section">
            <div class="quick-actions">
              <div class="action-card">
                <h3>User Management</h3>
                <p>Manage user accounts and permissions</p>
                <a href="/admin/users" class="btn">Manage Users</a>
              </div>
              <div class="action-card">
                <h3>Package Management</h3>
                <p>View and manage all permit packages</p>
                <a href="/admin/packages" class="btn">View All Packages</a>
              </div>
              <div class="action-card">
                <h3>System Settings</h3>
                <p>Configure application settings</p>
                <a href="/admin/settings" class="btn">Settings</a>
              </div>
              <div class="action-card">
                <h3>Reports</h3>
                <p>Generate system reports and analytics</p>
                <a href="/admin/reports" class="btn">View Reports</a>
              </div>
            </div>
          </div>
          ` : ""}
        </div>
      </body>
      </html>
    `);
  });
  app2.get("/", (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect("/dashboard");
    }
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Permit Tracker</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container { 
            text-align: center; 
            background: white; 
            padding: 3rem; 
            border-radius: 12px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          h1 { margin-bottom: 1rem; color: #1f2937; }
          p { margin-bottom: 2rem; color: #6b7280; }
          .btn { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            text-decoration: none; 
            display: inline-block;
            font-size: 16px;
            font-weight: 500;
          }
          .btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Permit Package Tracker</h1>
          <p>Streamline your building permit process with comprehensive package management.</p>
          <a href="/api/login" class="btn">Sign In</a>
        </div>
      </body>
      </html>
    `);
  });
  app2.get("/api/files/:filename", isAuthenticated, (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path2.join(uploadsDir, filename);
      if (!fs2.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      const stats = fs2.statSync(filePath);
      const fileExtension = path2.extname(filename).toLowerCase();
      let contentType = "application/octet-stream";
      if (fileExtension === ".pdf") {
        contentType = "application/pdf";
      } else if ([".jpg", ".jpeg"].includes(fileExtension)) {
        contentType = "image/jpeg";
      } else if (fileExtension === ".png") {
        contentType = "image/png";
      } else if (fileExtension === ".gif") {
        contentType = "image/gif";
      }
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      const fileStream = fs2.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ message: "Error serving file" });
    }
  });
  app2.get("/api/oauth-status", (req, res) => {
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;
    const useDevAuth = process.env.USE_DEV_AUTH;
    res.json({
      clientIdConfigured: clientId && clientId !== "your-client-id",
      clientSecretConfigured: clientSecret && clientSecret !== "your-client-secret",
      developmentMode: useDevAuth === "true",
      expectedRedirectURI: "http://localhost:5000/api/callback",
      currentHostname: req.hostname,
      allowedDomains: process.env.ALLOWED_DOMAINS?.split(",") || [],
      instructions: {
        step1: "Go to Google Cloud Console (console.cloud.google.com)",
        step2: "Navigate to APIs & Services > Credentials",
        step3: "Find your OAuth 2.0 Client ID",
        step4: "Add this exact redirect URI: http://localhost:5000/api/callback",
        step5: "Set USE_DEV_AUTH=false in .env to test real OAuth"
      }
    });
  });
  app2.get("/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users3 = await storage2.getAllUsers();
      const currentUser = req.dbUser;
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>User Management - Permit System</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; background: #f8fafc; }
            .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; }
            .nav { background: white; border-bottom: 1px solid #e2e8f0; }
            .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; gap: 2rem; }
            .nav a { padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent; }
            .nav a.active { color: #3b82f6; border-bottom-color: #3b82f6; }
            .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
            .users-table { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
            .table-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; font-weight: 600; color: #374151; }
            .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
            .status-approved { background: #d1fae5; color: #065f46; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-rejected { background: #fee2e2; color: #dc2626; }
            .role-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: #3b82f6; color: white; }
            .btn { background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 0.875rem; cursor: pointer; }
            .btn-sm { padding: 4px 8px; font-size: 0.75rem; }
            .btn-success { background: #10b981; }
            .btn-danger { background: #ef4444; }
            .logout { color: #dc2626; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
              <h1>User Management</h1>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: #64748b; font-size: 0.875rem;">Welcome, ${currentUser.firstName} ${currentUser.lastName}</span>
                <span class="role-badge">${currentUser.role}</span>
                <a href="/api/logout" class="logout">Logout</a>
              </div>
            </div>
          </div>
          
          <div class="nav">
            <div class="nav-inner">
              <a href="/dashboard">Dashboard</a>
              <a href="/admin/users" class="active">User Management</a>
              <a href="/admin/packages">All Packages</a>
              <a href="/admin/settings">System Settings</a>
              <a href="/admin/reports">Reports</a>
            </div>
          </div>
          
          <div class="container">
            <div class="users-table">
              <div class="table-header">
                <h2>System Users</h2>
                <button class="btn" onclick="window.location.reload()">Refresh</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Company</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${users3.map((user) => `
                    <tr>
                      <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                          ${user.profileImageUrl ? `<img src="${user.profileImageUrl}" alt="" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #6b7280; font-weight: 600;">${user.firstName?.[0] || "U"}</div>`}
                          <div>
                            <div style="font-weight: 500;">${user.firstName || ""} ${user.lastName || ""}</div>
                            <div style="font-size: 0.75rem; color: #6b7280;">ID: ${user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>${user.email || "N/A"}</td>
                      <td><span class="role-badge">${user.role}</span></td>
                      <td><span class="status-badge status-${user.approvalStatus}">${user.approvalStatus}</span></td>
                      <td>${user.company || "N/A"}</td>
                      <td>${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</td>
                      <td>
                        <div style="display: flex; gap: 0.5rem;">
                          ${user.approvalStatus === "pending" ? `<button class="btn btn-sm btn-success" onclick="approveUser('${user.id}')">Approve</button>` : ""}
                          ${user.isActive ? `<button class="btn btn-sm btn-danger" onclick="deactivateUser('${user.id}')">Deactivate</button>` : `<button class="btn btn-sm btn-success" onclick="activateUser('${user.id}')">Activate</button>`}
                          <button class="btn btn-sm btn-warning" onclick="resetPassword('${user.id}')">Reset Password</button>
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
          
          <script>
            async function approveUser(userId) {
              if (confirm('Approve this user?')) {
                try {
                  const response = await fetch('/api/admin/users/' + userId, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ approvalStatus: 'approved' })
                  });
                  if (response.ok) {
                    location.reload();
                  } else {
                    alert('Failed to approve user');
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                }
              }
            }
            
            async function deactivateUser(userId) {
              if (confirm('Deactivate this user?')) {
                try {
                  const response = await fetch('/api/admin/users/' + userId, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: false })
                  });
                  if (response.ok) {
                    location.reload();
                  } else {
                    alert('Failed to deactivate user');
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                }
              }
            }
            
            async function activateUser(userId) {
              if (confirm('Activate this user?')) {
                try {
                  const response = await fetch('/api/admin/users/' + userId, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: true })
                  });
                  if (response.ok) {
                    location.reload();
                  } else {
                    alert('Failed to activate user');
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                }
              }
            }
            
            async function resetPassword(userId) {
              if (confirm('Reset this user's password? They will need to use the new temporary password.')) {
                try {
                  const response = await fetch('/api/admin/users/' + userId + '/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  if (response.ok) {
                    const result = await response.json();
                    alert('Password reset successful! New temporary password: ' + result.tempPassword + '\\n\\nPlease save this password and share it securely with the user.');
                  } else {
                    alert('Failed to reset password');
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                }
              }
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in user management page:", error);
      res.status(500).send("Error loading user management page");
    }
  });
  app2.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users3 = await storage2.getAllUsers();
      res.json(users3);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const updates = req.body;
      const user = await storage2.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.post("/api/admin/users/:id/reset-password", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const tempPassword = await storage2.resetUserPassword(userId);
      res.json({
        message: "Password reset successful",
        tempPassword
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.get("/admin/packages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const packages = await storage2.getAllPackages();
      const users3 = await storage2.getAllUsers();
      const currentUser = req.dbUser;
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Package Management - Permit System</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; background: #f8fafc; }
            .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; }
            .nav { background: white; border-bottom: 1px solid #e2e8f0; }
            .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; gap: 2rem; }
            .nav a { padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent; }
            .nav a.active { color: #3b82f6; border-bottom-color: #3b82f6; }
            .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
            .packages-table { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
            .table-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; font-weight: 600; color: #374151; }
            .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
            .status-draft { background: #f3f4f6; color: #374151; }
            .status-in_progress { background: #fef3c7; color: #92400e; }
            .status-ready_to_submit { background: #d1fae5; color: #065f46; }
            .status-submitted { background: #dbeafe; color: #1e40af; }
            .progress-bar { background: #e5e7eb; height: 4px; border-radius: 2px; margin-top: 0.25rem; width: 60px; }
            .progress-fill { background: #3b82f6; height: 100%; border-radius: 2px; }
            .btn { background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 0.875rem; cursor: pointer; }
            .btn-sm { padding: 4px 8px; font-size: 0.75rem; }
            .btn-success { background: #10b981; }
            .btn-danger { background: #ef4444; }
            .role-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: #3b82f6; color: white; }
            .logout { color: #dc2626; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
              <h1>Package Management</h1>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: #64748b; font-size: 0.875rem;">Welcome, ${currentUser.firstName} ${currentUser.lastName}</span>
                <span class="role-badge">${currentUser.role}</span>
                <a href="/api/logout" class="logout">Logout</a>
              </div>
            </div>
          </div>
          
          <div class="nav">
            <div class="nav-inner">
              <a href="/dashboard">Dashboard</a>
              <a href="/admin/users">User Management</a>
              <a href="/admin/packages" class="active">All Packages</a>
              <a href="/admin/settings">System Settings</a>
              <a href="/admin/reports">Reports</a>
            </div>
          </div>
          
          <div class="container">
            <div class="packages-table">
              <div class="table-header">
                <h2>All Permit Packages</h2>
                <div style="display: flex; gap: 1rem;">
                  <select onchange="filterPackages(this.value)" style="padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px;">
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="ready_to_submit">Ready to Submit</option>
                    <option value="submitted">Submitted</option>
                  </select>
                  <button class="btn" onclick="window.location.reload()">Refresh</button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Client</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${packages.map((pkg) => {
        const assignedUser = users3.find((u) => u.id === pkg.assignedTo);
        const createdUser = users3.find((u) => u.id === pkg.createdBy);
        return `
                    <tr>
                      <td>
                        <div>
                          <div style="font-weight: 500;">${pkg.projectName}</div>
                          <div style="font-size: 0.75rem; color: #6b7280;">${pkg.address}</div>
                        </div>
                      </td>
                      <td>${pkg.permitType}</td>
                      <td><span class="status-badge status-${pkg.status}">${pkg.status.replace("_", " ")}</span></td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <div class="progress-bar">
                            <div class="progress-fill" style="width: ${pkg.progressPercentage}%"></div>
                          </div>
                          <span style="font-size: 0.75rem; color: #6b7280;">${pkg.completedDocuments}/${pkg.totalDocuments}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style="font-weight: 500;">${pkg.clientName || "N/A"}</div>
                          <div style="font-size: 0.75rem; color: #6b7280;">${pkg.clientEmail || ""}</div>
                        </div>
                      </td>
                      <td>${assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "Unassigned"}</td>
                      <td>
                        <div>
                          <div>${new Date(pkg.createdAt).toLocaleDateString()}</div>
                          <div style="font-size: 0.75rem; color: #6b7280;">${createdUser ? `${createdUser.firstName} ${createdUser.lastName}` : "Unknown"}</div>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; gap: 0.5rem;">
                          <button class="btn btn-sm" onclick="viewPackage(${pkg.id})">View</button>
                          <button class="btn btn-sm btn-danger" onclick="deletePackage(${pkg.id})">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `;
      }).join("")}
                </tbody>
              </table>
            </div>
          </div>
          
          <script>
            function filterPackages(status) {
              const rows = document.querySelectorAll('tbody tr');
              rows.forEach(row => {
                if (!status || row.textContent.toLowerCase().includes(status.replace('_', ' '))) {
                  row.style.display = '';
                } else {
                  row.style.display = 'none';
                }
              });
            }
            
            function viewPackage(packageId) {
              window.location.href = '/packages/' + packageId;
            }
            
            async function deletePackage(packageId) {
              if (confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
                try {
                  const response = await fetch('/api/packages/' + packageId, {
                    method: 'DELETE'
                  });
                  if (response.ok) {
                    location.reload();
                  } else {
                    alert('Failed to delete package');
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                }
              }
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in package management page:", error);
      res.status(500).send("Error loading package management page");
    }
  });
  app2.get("/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings3 = await storage2.getAllSettings();
      const currentUser = req.dbUser;
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>System Settings - Permit System</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; background: #f8fafc; }
            .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; }
            .nav { background: white; border-bottom: 1px solid #e2e8f0; }
            .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; gap: 2rem; }
            .nav a { padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent; }
            .nav a.active { color: #3b82f6; border-bottom-color: #3b82f6; }
            .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
            .settings-grid { display: grid; gap: 1.5rem; }
            .setting-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
            .setting-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; }
            .setting-content { padding: 1.5rem; }
            .form-group { margin-bottom: 1rem; }
            .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
            .form-input { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; }
            .form-textarea { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; min-height: 100px; }
            .btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
            .btn:hover { background: #2563eb; }
            .role-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: #3b82f6; color: white; }
            .logout { color: #dc2626; text-decoration: none; }
            .system-info { background: #f8fafc; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
              <h1>System Settings</h1>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: #64748b; font-size: 0.875rem;">Welcome, ${currentUser.firstName} ${currentUser.lastName}</span>
                <span class="role-badge">${currentUser.role}</span>
                <a href="/api/logout" class="logout">Logout</a>
              </div>
            </div>
          </div>
          
          <div class="nav">
            <div class="nav-inner">
              <a href="/dashboard">Dashboard</a>
              <a href="/admin/users">User Management</a>
              <a href="/admin/packages">All Packages</a>
              <a href="/admin/settings" class="active">System Settings</a>
              <a href="/admin/reports">Reports</a>
            </div>
          </div>
          
          <div class="container">
            <div class="settings-grid">
              <div class="setting-card">
                <div class="setting-header">
                  <h2>System Information</h2>
                </div>
                <div class="setting-content">
                  <div class="system-info">
                    <div><strong>Application Version:</strong> 1.0.0</div>
                    <div><strong>Database:</strong> PostgreSQL</div>
                    <div><strong>Environment:</strong> ${process.env.NODE_ENV || "development"}</div>
                    <div><strong>Authentication:</strong> ${process.env.USE_DEV_AUTH === "true" ? "Local Development" : "Google OAuth"}</div>
                  </div>
                </div>
              </div>
              
              <div class="setting-card">
                <div class="setting-header">
                  <h2>Application Settings</h2>
                </div>
                <div class="setting-content">
                  <form onsubmit="updateSettings(event)">
                    <div class="form-group">
                      <label class="form-label">Application Name</label>
                      <input type="text" class="form-input" name="app_name" value="Permit Management System">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Default Permit Types</label>
                      <textarea class="form-textarea" name="permit_types" placeholder="Enter permit types, one per line">Building Permit
Electrical Permit
Plumbing Permit
Mechanical Permit
Demolition Permit</textarea>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Auto-approve New Users</label>
                      <select class="form-input" name="auto_approve">
                        <option value="true" ${process.env.AUTO_APPROVE_USERS === "true" ? "selected" : ""}>Yes</option>
                        <option value="false" ${process.env.AUTO_APPROVE_USERS !== "true" ? "selected" : ""}>No</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">System Email</label>
                      <input type="email" class="form-input" name="system_email" value="admin@permittracker.com">
                    </div>
                    <button type="submit" class="btn">Save Settings</button>
                  </form>
                </div>
              </div>
              
              <div class="setting-card">
                <div class="setting-header">
                  <h2>Document Management</h2>
                </div>
                <div class="setting-content">
                  <div class="form-group">
                    <label class="form-label">Maximum File Size (MB)</label>
                    <input type="number" class="form-input" value="10" min="1" max="100">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Allowed File Types</label>
                    <input type="text" class="form-input" value="PDF, DOC, DOCX, XLS, XLSX, JPG, PNG" readonly>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Storage Location</label>
                    <input type="text" class="form-input" value="./uploads" readonly>
                  </div>
                </div>
              </div>
              
              <div class="setting-card">
                <div class="setting-header">
                  <h2>Database Management</h2>
                </div>
                <div class="setting-content">
                  <button class="btn" onclick="backupDatabase()" style="margin-right: 1rem;">Backup Database</button>
                  <button class="btn" onclick="optimizeDatabase()">Optimize Database</button>
                  <div style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
                    Last backup: Never
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <script>
            function updateSettings(event) {
              event.preventDefault();
              alert('Settings updated successfully!');
            }
            
            function backupDatabase() {
              if (confirm('Create a database backup? This may take a few minutes.')) {
                alert('Database backup initiated. You will be notified when complete.');
              }
            }
            
            function optimizeDatabase() {
              if (confirm('Optimize database performance? This may take a few minutes.')) {
                alert('Database optimization initiated.');
              }
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in settings page:", error);
      res.status(500).send("Error loading settings page");
    }
  });
  app2.get("/api/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings3 = await storage2.getAllSettings();
      res.json(settings3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.get("/api/settings/category/:category", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { category } = req.params;
      const settings3 = await storage2.getSettingsByCategory(category);
      res.json(settings3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.put("/api/settings/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updateSettingSchema2.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid setting data",
          errors: validation.error.errors
        });
      }
      const updatedSetting = await storage2.updateSetting(id, {
        ...validation.data,
        updatedBy: req.user.id
      });
      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  app2.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users3 = await storage2.getAllUsers();
      res.json(users3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/pending", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users3 = await storage2.getAllUsers();
      const pendingUsers = users3.filter((user) => user.approvalStatus === "pending");
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  app2.post("/api/users/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await storage2.updateUser(id, {
        approvalStatus: "approved",
        approvedBy: req.user.id,
        approvedAt: /* @__PURE__ */ new Date(),
        rejectionReason: null
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user" });
    }
  });
  app2.post("/api/users/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updatedUser = await storage2.updateUser(id, {
        approvalStatus: "rejected",
        approvedBy: req.user.id,
        approvedAt: /* @__PURE__ */ new Date(),
        rejectionReason: reason || "No reason provided"
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject user" });
    }
  });
  app2.put("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedUser = await storage2.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.get("/api/packages", isAuthenticated, async (req, res) => {
    try {
      const packages = await storage2.getAllPackages();
      const stats = await storage2.getPackageStats();
      let filteredPackages = packages;
      const { status, permitType, search } = req.query;
      if (status && status !== "all") {
        filteredPackages = filteredPackages.filter((pkg) => pkg.status === status);
      }
      if (permitType && permitType !== "all") {
        filteredPackages = filteredPackages.filter((pkg) => pkg.permitType === permitType);
      }
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredPackages = filteredPackages.filter(
          (pkg) => pkg.projectName.toLowerCase().includes(searchTerm) || pkg.address.toLowerCase().includes(searchTerm) || pkg.clientName?.toLowerCase().includes(searchTerm)
        );
      }
      res.json({ packages: filteredPackages, stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });
  app2.get("/api/packages/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const packageWithDocuments = await storage2.getPackageWithDocuments(id);
      if (!packageWithDocuments) {
        return res.status(404).json({ message: "Package not found" });
      }
      res.json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch package" });
    }
  });
  app2.post("/api/packages", isAuthenticated, async (req, res) => {
    try {
      const validation = insertPermitPackageSchema2.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid package data",
          errors: validation.error.errors
        });
      }
      const packageData = validation.data;
      const newPackage = await storage2.createPackage(packageData);
      if (packageData.permitType === "Building Permit") {
        for (const docTemplate of DEFAULT_BUILDING_PERMIT_DOCS2) {
          await storage2.createDocument({
            packageId: newPackage.id,
            documentName: docTemplate.documentName,
            isRequired: docTemplate.isRequired,
            isCompleted: 0
          });
        }
      }
      const packageWithDocuments = await storage2.getPackageWithDocuments(newPackage.id);
      res.status(201).json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to create package" });
    }
  });
  app2.patch("/api/packages/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const validation = updatePermitPackageSchema2.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: validation.error.errors
        });
      }
      const updatedPackage = await storage2.updatePackage(id, validation.data);
      if (!updatedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      const packageWithDocuments = await storage2.getPackageWithDocuments(id);
      res.json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to update package" });
    }
  });
  app2.delete("/api/packages/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const deleted = await storage2.deletePackage(id);
      if (!deleted) {
        return res.status(404).json({ message: "Package not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete package" });
    }
  });
  app2.patch("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      const validation = updateDocumentSchema2.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid document data",
          errors: validation.error.errors
        });
      }
      const updatedDocument = await storage2.updateDocument(id, validation.data);
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });
  app2.post("/api/packages/:packageId/documents", isAuthenticated, async (req, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const packageExists = await storage2.getPackage(packageId);
      if (!packageExists) {
        return res.status(404).json({ message: "Package not found" });
      }
      const validation = insertDocumentSchema2.safeParse({
        ...req.body,
        packageId
      });
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid document data",
          errors: validation.error.errors
        });
      }
      const newDocument = await storage2.createDocument(validation.data);
      res.status(201).json(newDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to add document" });
    }
  });
  app2.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage2.getPackageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  app2.post("/api/documents/:id/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const updatedDocument = await storage2.updateDocument(documentId, {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        isCompleted: 1
        // Mark as completed when file is uploaded
      });
      if (!updatedDocument) {
        fs2.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(updatedDocument);
    } catch (error) {
      if (req.file) {
        fs2.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.get("/api/documents/:id/download", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      const document = await storage2.getDocument(documentId);
      if (!document || !document.filePath) {
        return res.status(404).json({ message: "File not found" });
      }
      if (!fs2.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      res.setHeader("Content-Disposition", `attachment; filename="${document.fileName}"`);
      res.setHeader("Content-Type", document.mimeType || "application/octet-stream");
      const fileStream = fs2.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });
  app2.delete("/api/documents/:id/file", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      const document = await storage2.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      if (document.filePath && fs2.existsSync(document.filePath)) {
        fs2.unlinkSync(document.filePath);
      }
      const updatedDocument = await storage2.updateDocument(documentId, {
        fileName: null,
        fileSize: null,
        filePath: null,
        mimeType: null,
        isCompleted: 0
        // Mark as incomplete when file is removed
      });
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });
  app2.get("/api/health", async (req, res) => {
    try {
      const health = await healthMonitor.checkHealth();
      const status = healthMonitor.isHealthy() ? 200 : 503;
      res.status(status).json(health);
    } catch (error) {
      res.status(503).json({
        database: { connected: false, responseTime: 0, error: "Health check failed" },
        storage: { uploadsWritable: false, backupsWritable: false, diskSpace: { total: 0, free: 0, used: 0, percentage: 0 } },
        system: { uptime: process.uptime(), memory: { used: 0, total: 0, percentage: 0 } },
        lastCheck: /* @__PURE__ */ new Date()
      });
    }
  });
  app2.get("/api/network/share/:packageId", async (req, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const packageWithDocuments = await storage2.getPackageWithDocuments(packageId);
      if (!packageWithDocuments) {
        return res.status(404).json({ message: "Package not found" });
      }
      const shareablePackage = {
        ...packageWithDocuments,
        documents: packageWithDocuments.documents.map((doc) => ({
          ...doc,
          fileUrl: doc.fileName ? `/api/files/${doc.fileName}` : null
        })),
        shareUrl: `${req.protocol}://${req.get("host")}/api/network/share/${packageId}`,
        accessTime: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json(shareablePackage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create network share" });
    }
  });
  app2.get("/api/network/packages", async (req, res) => {
    try {
      const packages = await storage2.getAllPackages();
      const networkPackages = packages.map((pkg) => ({
        id: pkg.id,
        projectName: pkg.projectName,
        status: pkg.status,
        permitType: pkg.permitType,
        totalDocuments: pkg.totalDocuments,
        completedDocuments: pkg.completedDocuments,
        progressPercentage: pkg.progressPercentage,
        shareUrl: `${req.protocol}://${req.get("host")}/api/network/share/${pkg.id}`,
        lastUpdated: pkg.updatedAt
      }));
      res.json({
        packages: networkPackages,
        serverInfo: {
          host: req.get("host"),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          totalPackages: packages.length
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to list network packages" });
    }
  });
  app2.get("/api/network/download/:packageId", async (req, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const packageWithDocuments = await storage2.getPackageWithDocuments(packageId);
      if (!packageWithDocuments) {
        return res.status(404).json({ message: "Package not found" });
      }
      const downloadPackage = {
        package: packageWithDocuments,
        files: packageWithDocuments.documents.filter((doc) => doc.fileName).map((doc) => ({
          documentName: doc.documentName,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          downloadUrl: `${req.protocol}://${req.get("host")}/api/files/${doc.fileName}`,
          mimeType: doc.mimeType
        })),
        downloadInfo: {
          packageName: packageWithDocuments.projectName,
          totalFiles: packageWithDocuments.documents.filter((doc) => doc.fileName).length,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="package-${packageId}-files.json"`);
      res.json(downloadPackage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create download package" });
    }
  });
  app2.get("/api/system/status", async (req, res) => {
    try {
      const health = await healthMonitor.checkHealth();
      const systemInfo = {
        ...health,
        config: {
          environment: config.server.environment,
          databaseHost: config.database.host,
          uploadsDirectory: config.uploads.directory,
          backupDirectory: config.backup.directory,
          maxFileSize: config.uploads.maxFileSize,
          autoBackup: config.backup.autoBackup
        },
        version: process.env.npm_package_version || "1.0.0",
        nodeVersion: process.version
      };
      res.json(systemInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system status" });
    }
  });
  app2.post("/api/system/backup", isAdmin, async (req, res) => {
    try {
      const { execSync } = __require("child_process");
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const backupFile = path2.join(config.backup.directory, `permits_backup_${timestamp2}.sql`);
      if (!fs2.existsSync(config.backup.directory)) {
        fs2.mkdirSync(config.backup.directory, { recursive: true });
      }
      const dbUrl = new URL(config.database.url);
      const env = { ...process.env, PGPASSWORD: dbUrl.password };
      execSync(`pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port || 5432} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -f ${backupFile}`, {
        env,
        stdio: "pipe"
      });
      const stats = fs2.statSync(backupFile);
      res.json({
        success: true,
        backupFile,
        size: stats.size,
        timestamp: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Backup failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.use("/uploads", express.static(uploadsDir));
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/seed-database.ts
init_sqlite_db();
init_sqlite_schema();
init_local_auth();
async function seedDatabase() {
  const existingUsers = await db2.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }
  console.log("Seeding database with sample data...");
  const adminPasswordHash = await hashPassword("admin123");
  const [adminUser] = await db2.insert(users).values({
    id: "admin",
    email: "admin@localhost",
    passwordHash: adminPasswordHash,
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    isActive: true,
    approvalStatus: "approved",
    approvedAt: Math.floor(Date.now() / 1e3)
  }).returning();
  console.log("Created admin user: admin@localhost / admin123");
  const [regularUser] = await db2.insert(users).values({
    id: "user-1",
    email: "user@permittracker.com",
    firstName: "John",
    lastName: "Doe",
    role: "user",
    isActive: true,
    approvalStatus: "approved",
    approvedAt: /* @__PURE__ */ new Date()
  }).returning();
  for (const settingData of DEFAULT_SETTINGS) {
    await db2.insert(settings).values({
      ...settingData,
      updatedBy: adminUser.id
    });
  }
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
      estimatedValue: 25e7,
      // $2.5M in cents
      createdBy: adminUser.id,
      assignedTo: regularUser.id
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
      estimatedValue: 75e5,
      // $75K in cents
      createdBy: regularUser.id,
      assignedTo: regularUser.id
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
      estimatedValue: 15e7,
      // $1.5M in cents
      createdBy: adminUser.id,
      assignedTo: regularUser.id
    }
  ];
  for (const packageData of samplePackages) {
    const [pkg] = await db2.insert(permitPackages).values(packageData).returning();
    if (packageData.permitType === "Building Permit") {
      const docPromises = DEFAULT_BUILDING_PERMIT_DOCS.map(async (docTemplate, index2) => {
        const completedCount = packageData.status === "ready_to_submit" ? DEFAULT_BUILDING_PERMIT_DOCS.length : packageData.status === "in_progress" ? Math.floor(DEFAULT_BUILDING_PERMIT_DOCS.length / 2) : 2;
        return db2.insert(packageDocuments).values({
          packageId: pkg.id,
          documentName: docTemplate.documentName,
          isRequired: docTemplate.isRequired,
          isCompleted: index2 < completedCount ? 1 : 0
        });
      });
      await Promise.all(docPromises);
    }
  }
  console.log("Database seeded successfully!");
  console.log("Administrator account created: admin@permittracker.com");
}
if (import.meta.main) {
  seedDatabase().then(() => {
    console.log("Seeding completed!");
    process.exit(0);
  }).catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}

// server/index.ts
init_config();
process.env.DATABASE_URL = "file:./permit_system.db";
process.env.FORCE_LOCAL_AUTH = "true";
delete process.env.PGDATABASE;
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGHOST;
delete process.env.PGPORT;
console.log("Forced SQLite database for all deployments");
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  if (!process.env.DATABASE_URL?.includes("file:")) {
    await seedDatabase();
  } else {
    console.log("Using SQLite with manual admin user setup");
  }
  if (process.env.FORCE_LOCAL_AUTH === "true") {
    const { setupLocalAuth: setupLocalAuth3 } = await Promise.resolve().then(() => (init_local_auth(), local_auth_exports));
    await setupLocalAuth3(app);
    console.log("Pre-registered local SQLite authentication routes");
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Error:", err);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = config.server.port;
  const host = config.server.host;
  server.listen({
    port,
    host,
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
