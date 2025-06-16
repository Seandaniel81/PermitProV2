import { db } from "./db";
import { permitPackages, packageDocuments, users, settings, DEFAULT_BUILDING_PERMIT_DOCS, DEFAULT_SETTINGS } from "@shared/schema";

export async function seedDatabase() {
  // Check if database already has data
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database with sample data...");

  // Create administrator user
  const [adminUser] = await db.insert(users).values({
    id: "admin-1",
    email: "admin@permittracker.com",
    firstName: "System",
    lastName: "Administrator",
    role: "admin",
    isActive: true,
    approvalStatus: "approved",
    approvedAt: new Date(),
  }).returning();

  // Create regular user
  const [regularUser] = await db.insert(users).values({
    id: "user-1",
    email: "user@permittracker.com",
    firstName: "John",
    lastName: "Doe",
    role: "user",
    isActive: true,
    approvalStatus: "approved",
    approvedAt: new Date(),
  }).returning();

  // Insert default settings
  for (const settingData of DEFAULT_SETTINGS) {
    await db.insert(settings).values({
      ...settingData,
      updatedBy: adminUser.id,
    });
  }

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
      createdBy: adminUser.id,
      assignedTo: regularUser.id,
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
      createdBy: regularUser.id,
      assignedTo: regularUser.id,
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
      createdBy: adminUser.id,
      assignedTo: regularUser.id,
    }
  ];

  for (const packageData of samplePackages) {
    // Insert package
    const [pkg] = await db.insert(permitPackages).values(packageData).returning();
    
    // Add default documents for building permits
    if (packageData.permitType === "Building Permit") {
      const docPromises = DEFAULT_BUILDING_PERMIT_DOCS.map(async (docTemplate, index) => {
        const completedCount = packageData.status === "ready_to_submit" ? 
          DEFAULT_BUILDING_PERMIT_DOCS.length : 
          packageData.status === "in_progress" ? 
            Math.floor(DEFAULT_BUILDING_PERMIT_DOCS.length / 2) : 
            2;
        
        return db.insert(packageDocuments).values({
          packageId: pkg.id,
          documentName: docTemplate.documentName,
          isRequired: docTemplate.isRequired,
          isCompleted: index < completedCount ? 1 : 0,
        });
      });
      
      await Promise.all(docPromises);
    }
  }

  console.log("Database seeded successfully!");
  console.log("Administrator account created: admin@permittracker.com");
}