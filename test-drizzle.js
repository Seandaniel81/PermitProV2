import { db } from './server/sqlite-db.js';
import { users } from './shared/sqlite-schema.js';
import { eq } from 'drizzle-orm';

async function testDrizzleMapping() {
  try {
    console.log('Testing Drizzle ORM field mapping...');
    
    const [user] = await db.select().from(users).where(eq(users.email, 'admin@localhost'));
    
    console.log('User retrieved via Drizzle:');
    console.log(JSON.stringify(user, null, 2));
    
    console.log('\nSpecific field checks:');
    console.log('user.passwordHash:', user?.passwordHash);
    console.log('user.password_hash:', user?.password_hash);
    console.log('user.isActive:', user?.isActive);
    console.log('user.is_active:', user?.is_active);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDrizzleMapping();