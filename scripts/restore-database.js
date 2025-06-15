#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📥 Restoring database from backup...\n');

// Get backup file from command line argument
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Please provide a backup file path');
  console.log('   Usage: node scripts/restore-database.js /path/to/backup.sql');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error('❌ Backup file not found:', backupFile);
  process.exit(1);
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

try {
  // Extract database connection info from DATABASE_URL
  const dbUrl = new URL(process.env.DATABASE_URL);
  const host = dbUrl.hostname;
  const port = dbUrl.port || 5432;
  const database = dbUrl.pathname.slice(1);
  const username = dbUrl.username;
  const password = dbUrl.password;

  // Set PGPASSWORD environment variable for psql
  const env = { ...process.env, PGPASSWORD: password };

  console.log(`📊 Restoring to database: ${database}`);
  console.log(`📁 Backup file: ${backupFile}`);

  // Restore database from dump
  execSync(`psql -h ${host} -p ${port} -U ${username} -d ${database} -f ${backupFile}`, {
    env,
    stdio: 'inherit'
  });

  console.log('\n✅ Database restore completed successfully');

} catch (error) {
  console.error('❌ Failed to restore database:', error.message);
  console.log('\n💡 Make sure psql is installed and accessible in your PATH');
  process.exit(1);
}