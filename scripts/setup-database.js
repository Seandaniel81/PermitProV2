#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Setting up independent database for permit management system...\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.log('   Set it to your PostgreSQL connection string:');
  console.log('   export DATABASE_URL="postgresql://username:password@localhost:5432/permits_db"');
  process.exit(1);
}

console.log('✅ Database URL configured');

// Run database push to create tables
try {
  console.log('📊 Creating database tables...');
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Database tables created successfully');
} catch (error) {
  console.error('❌ Failed to create database tables:', error.message);
  process.exit(1);
}

// Run initial seed
try {
  console.log('🌱 Seeding initial data...');
  execSync('npx tsx server/seed-database.ts', { stdio: 'inherit' });
  console.log('✅ Initial data seeded successfully');
} catch (error) {
  console.error('❌ Failed to seed initial data:', error.message);
  process.exit(1);
}

console.log('\n🎉 Database setup complete!');
console.log('   Your permit management system is ready to use.');
console.log('   Run "npm run dev" to start the application.');