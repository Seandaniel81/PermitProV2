import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('./permit_system.db');

// Test current admin user
console.log('Checking current admin user...');
const currentUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@localhost');
console.log('Current user:', currentUser);

// Verify password works
const testPassword = 'admin123';
if (currentUser && currentUser.password_hash) {
  const isValid = bcrypt.compareSync(testPassword, currentUser.password_hash);
  console.log('Password test result:', isValid);
}

// Update admin user to ensure proper configuration
console.log('Updating admin user...');
const newPasswordHash = bcrypt.hashSync('admin123', 10);

db.prepare(`
  UPDATE users 
  SET password_hash = ?, 
      is_active = 1, 
      approval_status = 'approved',
      updated_at = ?
  WHERE email = ?
`).run(newPasswordHash, Math.floor(Date.now() / 1000), 'admin@localhost');

// Verify update
const updatedUser = db.prepare('SELECT id, email, password_hash, role, is_active, approval_status FROM users WHERE email = ?').get('admin@localhost');
console.log('Updated user:', updatedUser);

// Test password again
const finalTest = bcrypt.compareSync(testPassword, updatedUser.password_hash);
console.log('Final password test:', finalTest);

db.close();
console.log('Admin user fixed!');