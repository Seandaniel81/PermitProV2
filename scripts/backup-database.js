#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(process.cwd(), 'backups');
const backupFile = path.join(backupDir, `permits_backup_${timestamp}.sql`);

console.log('📦 Creating database backup...\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create backups directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('✅ Created backups directory');
}

try {
  // Extract database connection info from DATABASE_URL
  const dbUrl = new URL(process.env.DATABASE_URL);
  const host = dbUrl.hostname;
  const port = dbUrl.port || 5432;
  const database = dbUrl.pathname.slice(1);
  const username = dbUrl.username;
  const password = dbUrl.password;

  // Set PGPASSWORD environment variable for pg_dump
  const env = { ...process.env, PGPASSWORD: password };

  console.log(`📊 Backing up database: ${database}`);
  console.log(`📁 Backup location: ${backupFile}`);

  // Create database dump
  execSync(`pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f ${backupFile}`, {
    env,
    stdio: 'inherit'
  });

  console.log('\n✅ Database backup completed successfully');
  console.log(`   Backup saved to: ${backupFile}`);

  // Show backup file size
  const stats = fs.statSync(backupFile);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   Backup size: ${fileSizeInMB} MB`);

} catch (error) {
  console.error('❌ Failed to create database backup:', error.message);
  console.log('\n💡 Make sure pg_dump is installed and accessible in your PATH');
  process.exit(1);
}