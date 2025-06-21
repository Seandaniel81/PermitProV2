import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table for SQLite
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("user"), // user, admin
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: text("approved_by"),
  approvedAt: integer("approved_at"),
  rejectionReason: text("rejection_reason"),
  company: text("company"),
  phone: text("phone"),
  lastLoginAt: integer("last_login_at"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// Session storage table for SQLite
export const sessions = sqliteTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: integer("expire", { mode: "timestamp" }).notNull(),
});

// Settings table for SQLite
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const permitPackages = sqliteTable("permit_packages", {
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const packageDocuments = sqliteTable("package_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  packageId: integer("package_id").notNull().references(() => permitPackages.id, { onDelete: "cascade" }),
  documentName: text("document_name").notNull(),
  filename: text("filename"),
  originalName: text("original_name"),
  isRequired: integer("is_required", { mode: "boolean" }).notNull().default(true),
  isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
  uploadedBy: text("uploaded_by").references(() => users.id),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdPackages: many(permitPackages, { relationName: "creator" }),
  assignedPackages: many(permitPackages, { relationName: "assignee" }),
  uploadedDocuments: many(packageDocuments),
  updatedSettings: many(settings),
}));

export const permitPackagesRelations = relations(permitPackages, ({ many, one }) => ({
  documents: many(packageDocuments),
  assignedUser: one(users, {
    fields: [permitPackages.assignedTo],
    references: [users.id],
    relationName: "assignee",
  }),
  createdByUser: one(users, {
    fields: [permitPackages.createdBy],
    references: [users.id],
    relationName: "creator",
  }),
}));

export const packageDocumentsRelations = relations(packageDocuments, ({ one }) => ({
  package: one(permitPackages, {
    fields: [packageDocuments.packageId],
    references: [permitPackages.id],
  }),
  uploadedByUser: one(users, {
    fields: [packageDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [settings.updatedBy],
    references: [users.id],
  }),
}));

// Schema validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateUserSchema = insertUserSchema.partial();

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});
export const updateSettingSchema = insertSettingSchema.partial();

export const insertPermitPackageSchema = createInsertSchema(permitPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updatePermitPackageSchema = insertPermitPackageSchema.partial();

export const insertDocumentSchema = createInsertSchema(packageDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateDocumentSchema = insertDocumentSchema.partial();

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type UpdateSetting = z.infer<typeof updateSettingSchema>;

export type PermitPackage = typeof permitPackages.$inferSelect;
export type InsertPermitPackage = z.infer<typeof insertPermitPackageSchema>;
export type UpdatePermitPackage = z.infer<typeof updatePermitPackageSchema>;

export type PackageDocument = typeof packageDocuments.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;

export type PackageWithDocuments = PermitPackage & {
  documents: PackageDocument[];
  completedDocuments: number;
  totalDocuments: number;
  progressPercentage: number;
};

// Constants
export const PACKAGE_STATUSES = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress", 
  READY_TO_SUBMIT: "ready_to_submit",
  SUBMITTED: "submitted",
} as const;

export const PERMIT_TYPES = [
  "Building Permit",
  "Electrical Permit", 
  "Plumbing Permit",
  "Mechanical Permit",
  "Demolition Permit",
  "Zoning Permit",
  "Other"
] as const;

export const DEFAULT_SETTINGS = [
  {
    key: "system_name",
    value: "Permit Management System",
    description: "Display name for the system",
    category: "general",
    isSystem: true,
  },
  {
    key: "auto_approve_users",
    value: "false",
    description: "Automatically approve new user registrations",
    category: "security",
    isSystem: false,
  },
  {
    key: "max_file_size",
    value: "10485760",
    description: "Maximum file upload size in bytes (10MB)",
    category: "uploads",
    isSystem: false,
  },
  {
    key: "allowed_file_types",
    value: '["pdf","doc","docx","xls","xlsx","jpg","png"]',
    description: "Allowed file types for uploads",
    category: "uploads",
    isSystem: false,
  }
] as const;

export const DEFAULT_BUILDING_PERMIT_DOCS = [
  "Site Plan",
  "Floor Plans", 
  "Elevation Drawings",
  "Construction Details",
  "Structural Calculations",
  "Energy Compliance Forms",
  "Zoning Compliance Letter",
  "Building Code Analysis"
] as const;