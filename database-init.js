import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { DEFAULT_SETTINGS } from './shared/schema.js';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
  try {
    console.log('Initializing PostgreSQL database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await storage.upsertUser({
      id: 'admin',
      email: 'admin@localhost',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator', 
      role: 'admin',
      isActive: true,
      approvalStatus: 'approved',
    });

    console.log('Admin user created: admin@localhost / admin123');

    // Create default settings
    for (const setting of DEFAULT_SETTINGS) {
      await storage.upsertSetting({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        category: setting.category,
        isSystem: setting.isSystem,
      });
    }

    console.log('Default settings configured');

    // Create sample permit packages
    const samplePackages = [
      {
        projectName: 'Kitchen Renovation',
        address: '123 Main Street, Anytown',
        permitType: 'Building Permit',
        status: 'in_progress',
        description: 'Complete kitchen remodel with new electrical and plumbing',
        clientName: 'John Smith',
        clientEmail: 'john@example.com',
        clientPhone: '555-0123',
        estimatedValue: 5000000, // $50,000 in cents
        createdBy: 'admin',
      },
      {
        projectName: 'Deck Addition',
        address: '456 Oak Avenue, Somewhere',
        permitType: 'Building Permit',
        status: 'draft',
        description: 'New outdoor deck construction',
        clientName: 'Jane Doe',
        clientEmail: 'jane@example.com',
        clientPhone: '555-0124',
        estimatedValue: 1500000, // $15,000 in cents
        createdBy: 'admin',
      }
    ];

    for (const pkg of samplePackages) {
      await storage.createPackage(pkg);
    }

    console.log('Sample packages created');
    console.log('Database initialization complete!');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

if (import.meta.main) {
  await initializeDatabase();
  process.exit(0);
}