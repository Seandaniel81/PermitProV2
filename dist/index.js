var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
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
import { pgTable, text, serial, integer, timestamp, varchar, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
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
  rejectionReason: text("rejection_reason"),
  company: varchar("company"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  category: varchar("category").notNull().default("general"),
  isSystem: boolean("is_system").notNull().default(false),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var permitPackages = pgTable("permit_packages", {
  id: serial("id").primaryKey(),
  projectName: text("project_name").notNull(),
  address: text("address").notNull(),
  permitType: text("permit_type").notNull(),
  status: text("status").notNull().default("draft"),
  // draft, in_progress, ready_to_submit, submitted
  description: text("description"),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  estimatedValue: integer("estimated_value"),
  // in cents
  createdBy: varchar("created_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at")
});
var packageDocuments = pgTable("package_documents", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull().references(() => permitPackages.id, { onDelete: "cascade" }),
  documentName: text("document_name").notNull(),
  isRequired: integer("is_required").notNull().default(1),
  // 1 for true, 0 for false (SQLite compatibility)
  isCompleted: integer("is_completed").notNull().default(0),
  // 1 for true, 0 for false
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  // Path to the uploaded file
  mimeType: text("mime_type"),
  // File type (PDF, image, etc.)
  uploadedAt: timestamp("uploaded_at"),
  notes: text("notes")
});
var usersRelations = relations(users, ({ many, one }) => ({
  createdPackages: many(permitPackages, { relationName: "createdBy" }),
  assignedPackages: many(permitPackages, { relationName: "assignedTo" }),
  settingsUpdates: many(settings),
  approvedUsers: many(users, { relationName: "approver" })
  // approver: one(users, { 
  //   fields: [users.approvedBy], 
  //   references: [users.id],
  //   relationName: "approver"
  // }),
}));
var permitPackagesRelations = relations(permitPackages, ({ many, one }) => ({
  documents: many(packageDocuments),
  creator: one(users, {
    fields: [permitPackages.createdBy],
    references: [users.id],
    relationName: "createdBy"
  }),
  assignee: one(users, {
    fields: [permitPackages.assignedTo],
    references: [users.id],
    relationName: "assignedTo"
  })
}));
var packageDocumentsRelations = relations(packageDocuments, ({ one }) => ({
  package: one(permitPackages, {
    fields: [packageDocuments.packageId],
    references: [permitPackages.id]
  })
}));
var settingsRelations = relations(settings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [settings.updatedBy],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});
var updateUserSchema = insertUserSchema.partial();
var insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true
});
var updateSettingSchema = insertSettingSchema.partial();
var insertPermitPackageSchema = createInsertSchema(permitPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true
});
var updatePermitPackageSchema = insertPermitPackageSchema.partial();
var insertDocumentSchema = createInsertSchema(packageDocuments).omit({
  id: true,
  uploadedAt: true
});
var updateDocumentSchema = insertDocumentSchema.partial();
var PACKAGE_STATUSES = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  READY_TO_SUBMIT: "ready_to_submit",
  SUBMITTED: "submitted"
};
var PERMIT_TYPES = [
  "Building Permit",
  "Demolition Permit",
  "Electrical Permit",
  "Plumbing Permit",
  "Mechanical Permit",
  "Fire Permit",
  "Sign Permit",
  "Fence Permit"
];
var DEFAULT_SETTINGS = [
  {
    key: "database_type",
    value: { type: "postgresql", description: "PostgreSQL Database" },
    description: "Type of database being used for data storage",
    category: "database",
    isSystem: true
  },
  {
    key: "max_file_size",
    value: { size: 10485760, unit: "bytes" },
    // 10MB
    description: "Maximum file size for document uploads",
    category: "uploads",
    isSystem: false
  },
  {
    key: "allowed_file_types",
    value: { types: ["pdf", "doc", "docx", "jpg", "jpeg", "png"] },
    description: "Allowed file types for document uploads",
    category: "uploads",
    isSystem: false
  },
  {
    key: "require_approval",
    value: { enabled: true },
    description: "Require administrator approval for package submissions",
    category: "workflow",
    isSystem: false
  },
  {
    key: "email_notifications",
    value: { enabled: true, smtp_host: "", smtp_port: 587 },
    description: "Email notification settings",
    category: "notifications",
    isSystem: false
  },
  {
    key: "auto_backup",
    value: { enabled: false, interval: "daily" },
    description: "Automatic database backup settings",
    category: "backup",
    isSystem: false
  }
];
var DEFAULT_BUILDING_PERMIT_DOCS = [
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

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" && !process.env.DATABASE_URL.includes("localhost") ? { rejectUnauthorized: false } : false
});
var db = drizzle(pool, { schema: schema_exports });

// server/database-storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

// server/storage.ts
var storage = new DatabaseStorage();

// server/auth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";

// server/config.ts
import { z } from "zod";
import { randomBytes } from "crypto";
function generateSecureSecret() {
  return randomBytes(32).toString("hex");
}
var configSchema = z.object({
  // Database configuration
  database: z.object({
    url: z.string().url(),
    host: z.string().default("localhost"),
    port: z.number().int().min(1).max(65535).default(5432),
    name: z.string().min(1),
    user: z.string().min(1),
    password: z.string().min(1),
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
var config = loadConfig();

// server/auth.ts
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(config.auth.issuerUrl),
      config.auth.clientId
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = config.security.sessionMaxAge;
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
      secure: config.server.environment === "production",
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  const existingUser = await storage.getUser(claims["sub"]);
  if (!existingUser) {
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["given_name"] || claims["first_name"] || claims["name"]?.split(" ")[0] || "User",
      lastName: claims["family_name"] || claims["last_name"] || claims["name"]?.split(" ").slice(1).join(" ") || "",
      profileImageUrl: claims["picture"] || claims["profile_image_url"],
      approvalStatus: config.auth.autoApprove ? "approved" : "pending",
      role: "user"
    });
  } else {
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["given_name"] || claims["first_name"] || existingUser.firstName,
      lastName: claims["family_name"] || claims["last_name"] || existingUser.lastName,
      profileImageUrl: claims["picture"] || claims["profile_image_url"] || existingUser.profileImageUrl,
      approvalStatus: existingUser.approvalStatus,
      role: existingUser.role
    });
  }
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  if (config.server.environment === "development" && (config.auth.clientId === "your-client-id" || config.auth.clientSecret === "your-client-secret")) {
    console.warn("\u26A0\uFE0F  DEVELOPMENT MODE: OIDC not configured, using development bypass");
    app2.get("/api/dev-login", async (req, res) => {
      const devUser = await storage.getUser("dev-admin") || await storage.upsertUser({
        id: "dev-admin",
        email: "dev@localhost",
        firstName: "Development",
        lastName: "Admin",
        role: "admin",
        approvalStatus: "approved",
        isActive: true
      });
      req.login({ claims: { sub: "dev-admin", email: "dev@localhost" }, expires_at: Math.floor(Date.now() / 1e3) + 86400 }, (err) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        res.redirect("/");
      });
    });
    app2.get("/api/login", (req, res) => {
      res.redirect("/api/dev-login");
    });
    app2.get("/api/logout", (req, res) => {
      req.logout(() => {
        req.session.destroy((err) => {
          if (err) console.error("Session destruction error:", err);
          res.clearCookie("connect.sid");
          res.redirect("/");
        });
      });
    });
    return;
  }
  let oidcConfig;
  try {
    oidcConfig = await getOidcConfig();
  } catch (error) {
    console.error("Failed to get OIDC configuration:", error);
    throw new Error("OIDC configuration failed. Please check your OIDC_ISSUER_URL and credentials.");
  }
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of config.auth.domains) {
    const strategy = new Strategy(
      {
        name: `oidc:${domain}`,
        config: oidcConfig,
        scope: "openid email profile",
        callbackURL: `${config.server.environment === "production" ? "https" : "http"}://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    const strategyName = `oidc:${req.hostname}`;
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    const strategyName = `oidc:${req.hostname}`;
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        res.clearCookie("connect.sid");
        if (config.auth.logoutUrl) {
          res.redirect(config.auth.logoutUrl);
        } else {
          res.redirect("/");
        }
      });
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!dbUser.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }
    if (dbUser.approvalStatus === "rejected") {
      return res.status(403).json({
        message: "Account access denied",
        reason: dbUser.rejectionReason || "Your account has been rejected by an administrator"
      });
    }
    if (dbUser.approvalStatus === "pending") {
      return res.status(403).json({
        message: "Account pending approval",
        reason: "Your account is awaiting administrator approval"
      });
    }
    if (dbUser.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Account not approved" });
    }
    req.dbUser = dbUser;
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const oidcConfig = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(oidcConfig, refreshToken);
    updateUserSession(user, tokenResponse);
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser || dbUser.approvalStatus !== "approved" || !dbUser.isActive) {
      return res.status(403).json({ message: "Account not approved" });
    }
    req.dbUser = dbUser;
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
var isAdmin = async (req, res, next) => {
  const user = req.user;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const dbUser = await storage.getUser(user.claims.sub);
  if (!dbUser || dbUser.role !== "admin" || !dbUser.isActive) {
    return res.status(403).json({ message: "Admin access required" });
  }
  req.dbUser = dbUser;
  next();
};

// server/health-monitor.ts
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
import multer from "multer";
import path2 from "path";
import fs2 from "fs";
async function registerRoutes(app2) {
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
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings2 = await storage.getAllSettings();
      res.json(settings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.get("/api/settings/category/:category", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { category } = req.params;
      const settings2 = await storage.getSettingsByCategory(category);
      res.json(settings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.put("/api/settings/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updateSettingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid setting data",
          errors: validation.error.errors
        });
      }
      const updatedSetting = await storage.updateSetting(id, {
        ...validation.data,
        updatedBy: req.dbUser.id
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
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/pending", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const pendingUsers = users2.filter((user) => user.approvalStatus === "pending");
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  app2.post("/api/users/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await storage.updateUser(id, {
        approvalStatus: "approved",
        approvedBy: req.dbUser.id,
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
      const updatedUser = await storage.updateUser(id, {
        approvalStatus: "rejected",
        approvedBy: req.dbUser.id,
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
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.get("/api/packages", async (req, res) => {
    try {
      const packages = await storage.getAllPackages();
      const stats = await storage.getPackageStats();
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
  app2.get("/api/packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const packageWithDocuments = await storage.getPackageWithDocuments(id);
      if (!packageWithDocuments) {
        return res.status(404).json({ message: "Package not found" });
      }
      res.json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch package" });
    }
  });
  app2.post("/api/packages", async (req, res) => {
    try {
      const validation = insertPermitPackageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid package data",
          errors: validation.error.errors
        });
      }
      const packageData = validation.data;
      const newPackage = await storage.createPackage(packageData);
      if (packageData.permitType === "Building Permit") {
        for (const docTemplate of DEFAULT_BUILDING_PERMIT_DOCS) {
          await storage.createDocument({
            packageId: newPackage.id,
            documentName: docTemplate.documentName,
            isRequired: docTemplate.isRequired,
            isCompleted: 0
          });
        }
      }
      const packageWithDocuments = await storage.getPackageWithDocuments(newPackage.id);
      res.status(201).json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to create package" });
    }
  });
  app2.patch("/api/packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const validation = updatePermitPackageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: validation.error.errors
        });
      }
      const updatedPackage = await storage.updatePackage(id, validation.data);
      if (!updatedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      const packageWithDocuments = await storage.getPackageWithDocuments(id);
      res.json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to update package" });
    }
  });
  app2.delete("/api/packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const deleted = await storage.deletePackage(id);
      if (!deleted) {
        return res.status(404).json({ message: "Package not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete package" });
    }
  });
  app2.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      const validation = updateDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid document data",
          errors: validation.error.errors
        });
      }
      const updatedDocument = await storage.updateDocument(id, validation.data);
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });
  app2.post("/api/packages/:packageId/documents", async (req, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }
      const packageExists = await storage.getPackage(packageId);
      if (!packageExists) {
        return res.status(404).json({ message: "Package not found" });
      }
      const validation = insertDocumentSchema.safeParse({
        ...req.body,
        packageId
      });
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid document data",
          errors: validation.error.errors
        });
      }
      const newDocument = await storage.createDocument(validation.data);
      res.status(201).json(newDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to add document" });
    }
  });
  app2.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getPackageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  app2.post("/api/documents/:id/upload", upload.single("file"), async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const updatedDocument = await storage.updateDocument(documentId, {
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
  app2.get("/api/documents/:id/download", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      const document = await storage.getDocument(documentId);
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
  app2.delete("/api/documents/:id/file", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      if (document.filePath && fs2.existsSync(document.filePath)) {
        fs2.unlinkSync(document.filePath);
      }
      const updatedDocument = await storage.updateDocument(documentId, {
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
  app2.get("/api/system/status", isAdmin, async (req, res) => {
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
async function seedDatabase() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }
  console.log("Seeding database with sample data...");
  const [adminUser] = await db.insert(users).values({
    id: "admin-1",
    email: "admin@permittracker.com",
    firstName: "System",
    lastName: "Administrator",
    role: "admin",
    isActive: true,
    approvalStatus: "approved",
    approvedAt: /* @__PURE__ */ new Date()
  }).returning();
  const [regularUser] = await db.insert(users).values({
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
    await db.insert(settings).values({
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
    const [pkg] = await db.insert(permitPackages).values(packageData).returning();
    if (packageData.permitType === "Building Permit") {
      const docPromises = DEFAULT_BUILDING_PERMIT_DOCS.map(async (docTemplate, index2) => {
        const completedCount = packageData.status === "ready_to_submit" ? DEFAULT_BUILDING_PERMIT_DOCS.length : packageData.status === "in_progress" ? Math.floor(DEFAULT_BUILDING_PERMIT_DOCS.length / 2) : 2;
        return db.insert(packageDocuments).values({
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
  await seedDatabase();
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
