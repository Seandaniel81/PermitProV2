import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  uploadedAt: timestamp("uploaded_at"),
  notes: text("notes"),
});

// Relations
export const permitPackagesRelations = relations(permitPackages, ({ many }) => ({
  documents: many(packageDocuments),
}));

export const packageDocumentsRelations = relations(packageDocuments, ({ one }) => ({
  package: one(permitPackages, {
    fields: [packageDocuments.packageId],
    references: [permitPackages.id],
  }),
}));

// Permit package schemas
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
