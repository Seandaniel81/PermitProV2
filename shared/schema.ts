import { pgTable, text, serial, integer, timestamp, varchar, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // user, admin
  isActive: boolean("is_active").notNull().default(true),
  approvalStatus: varchar("approval_status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  company: varchar("company"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Settings table for system configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  category: varchar("category").notNull().default("general"),
  isSystem: boolean("is_system").notNull().default(false),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const permitPackages = pgTable("permit_packages", {
  id: serial("id").primaryKey(),
  projectName: text("project_name").notNull(),
  address: text("address").notNull(),
  permitType: text("permit_type").notNull(),
  status: text("status").notNull().default("draft"), // draft, in_progress, ready_to_submit, submitted
  description: text("description"),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  estimatedValue: integer("estimated_value"), // in cents
  createdBy: varchar("created_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
});

export const packageDocuments = pgTable("package_documents", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull().references(() => permitPackages.id, { onDelete: "cascade" }),
  documentName: text("document_name").notNull(),
  isRequired: integer("is_required").notNull().default(1), // 1 for true, 0 for false (SQLite compatibility)
  isCompleted: integer("is_completed").notNull().default(0), // 1 for true, 0 for false
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  filePath: text("file_path"), // Path to the uploaded file
  mimeType: text("mime_type"), // File type (PDF, image, etc.)
  uploadedAt: timestamp("uploaded_at"),
  notes: text("notes"),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  createdPackages: many(permitPackages, { relationName: "createdBy" }),
  assignedPackages: many(permitPackages, { relationName: "assignedTo" }),
  settingsUpdates: many(settings),
  approvedUsers: many(users, { relationName: "approver" }),
  // approver: one(users, { 
  //   fields: [users.approvedBy], 
  //   references: [users.id],
  //   relationName: "approver"
  // }),
}));

export const permitPackagesRelations = relations(permitPackages, ({ many, one }) => ({
  documents: many(packageDocuments),
  creator: one(users, {
    fields: [permitPackages.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  assignee: one(users, {
    fields: [permitPackages.assignedTo],
    references: [users.id],
    relationName: "assignedTo",
  }),
}));

export const packageDocumentsRelations = relations(packageDocuments, ({ one }) => ({
  package: one(permitPackages, {
    fields: [packageDocuments.packageId],
    references: [permitPackages.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [settings.updatedBy],
    references: [users.id],
  }),
}));

// Permit package schemas
// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = insertUserSchema.partial();

// Settings schemas
export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const updateSettingSchema = insertSettingSchema.partial();

// Package schemas
export const insertPermitPackageSchema = createInsertSchema(permitPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
});

export const updatePermitPackageSchema = insertPermitPackageSchema.partial();

// Document schemas
export const insertDocumentSchema = createInsertSchema(packageDocuments).omit({
  id: true,
  uploadedAt: true,
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

// Extended types for frontend
export type PackageWithDocuments = PermitPackage & {
  documents: PackageDocument[];
  completedDocuments: number;
  totalDocuments: number;
  progressPercentage: number;
};

// Status constants
export const PACKAGE_STATUSES = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  READY_TO_SUBMIT: 'ready_to_submit',
  SUBMITTED: 'submitted',
} as const;

export const PERMIT_TYPES = [
  'Building Permit',
  'Demolition Permit',
  'Electrical Permit',
  'Plumbing Permit',
  'Mechanical Permit',
  'Fire Permit',
  'Sign Permit',
  'Fence Permit',
] as const;

// Default system settings
export const DEFAULT_SETTINGS = [
  {
    key: 'database_type',
    value: { type: 'postgresql', description: 'PostgreSQL Database' },
    description: 'Type of database being used for data storage',
    category: 'database',
    isSystem: true,
  },
  {
    key: 'max_file_size',
    value: { size: 10485760, unit: 'bytes' }, // 10MB
    description: 'Maximum file size for document uploads',
    category: 'uploads',
    isSystem: false,
  },
  {
    key: 'allowed_file_types',
    value: { types: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'] },
    description: 'Allowed file types for document uploads',
    category: 'uploads',
    isSystem: false,
  },
  {
    key: 'require_approval',
    value: { enabled: true },
    description: 'Require administrator approval for package submissions',
    category: 'workflow',
    isSystem: false,
  },
  {
    key: 'email_notifications',
    value: { enabled: true, smtp_host: '', smtp_port: 587 },
    description: 'Email notification settings',
    category: 'notifications',
    isSystem: false,
  },
  {
    key: 'auto_backup',
    value: { enabled: false, interval: 'daily' },
    description: 'Automatic database backup settings',
    category: 'backup',
    isSystem: false,
  },
];

// Default document templates
export const DEFAULT_BUILDING_PERMIT_DOCS = [
  { documentName: 'Building Plans', isRequired: 1 },
  { documentName: 'Site Plan', isRequired: 1 },
  { documentName: 'Structural Calculations', isRequired: 1 },
  { documentName: 'Energy Compliance Forms', isRequired: 1 },
  { documentName: 'Permit Application Form', isRequired: 1 },
  { documentName: 'Property Survey', isRequired: 1 },
  { documentName: 'Soil Report', isRequired: 0 },
  { documentName: 'Environmental Impact Assessment', isRequired: 0 },
  { documentName: 'Traffic Impact Study', isRequired: 0 },
  { documentName: 'Fire Department Approval', isRequired: 1 },
  { documentName: 'Utility Clearances', isRequired: 1 },
  { documentName: 'HOA Approval', isRequired: 0 },
];
