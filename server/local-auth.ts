import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import MemoryStore from 'memorystore';
import Database from 'better-sqlite3';
import { config } from './config';
import type { Express, RequestHandler } from 'express';
import type { User } from '@shared/schema';

export function getSession() {
  const sessionTtl = config.security.sessionMaxAge;
  
  // Use memory store for SQLite/local development
  if (process.env.FORCE_LOCAL_AUTH === 'true' || process.env.DATABASE_URL?.includes('file:')) {
    const SessionStore = MemoryStore(session);
    const sessionStore = new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    return session({
      secret: config.security.sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: sessionTtl,
        sameSite: 'lax',
      },
    });
  }
  
  // Use PostgreSQL store for production
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: config.security.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Direct SQLite user lookup for local authentication
async function getUserByEmailSQLite(email: string): Promise<any | undefined> {
  if (process.env.FORCE_LOCAL_AUTH === 'true') {
    const db = new Database('./permit_system.db');
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      db.close();
      
      if (!user) return undefined;
      
      // Convert snake_case database fields to camelCase
      return {
        id: user.id,
        email: user.email,
        passwordHash: user.password_hash,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImageUrl: user.profile_image_url,
        role: user.role,
        isActive: Boolean(user.is_active),
        approvalStatus: user.approval_status,
        approvedBy: user.approved_by,
        approvedAt: user.approved_at,
        rejectionReason: user.rejection_reason,
        company: user.company,
        phone: user.phone,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('SQLite user lookup error:', error);
      db.close();
      return undefined;
    }
  }
  return undefined;
}

export async function setupLocalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        // Use direct SQLite lookup for local auth
        const user = process.env.FORCE_LOCAL_AUTH === 'true' ? 
          await getUserByEmailSQLite(email) : 
          await storage.getUserByEmail(email);
        
        console.log('Retrieved user:', JSON.stringify(user, null, 2));
        
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is disabled' });
        }

        if (user.approvalStatus !== 'approved') {
          return done(null, false, { message: 'Account pending approval' });
        }

        if (!user.passwordHash) {
          console.log('Password hash missing:', user.passwordHash);
          return done(null, false, { message: 'Account not properly configured' });
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid password' });
        }

        // Update last login time - skip for SQLite to avoid storage issues
        if (process.env.FORCE_LOCAL_AUTH !== 'true') {
          try {
            await storage.updateUser(user.id, { 
              lastLoginAt: new Date() 
            });
          } catch (error) {
            console.warn('Failed to update last login time:', error);
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Login route
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Authentication error' 
        });
      }
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: info?.message || 'Invalid credentials' 
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Login failed' 
          });
        }
        
        return res.json({ 
          success: true, 
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            approvalStatus: user.approvalStatus
          }
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Registration route (admin only)
  app.post('/api/register', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role = 'user', company, phone } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({ error: 'Email, password, and first name are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const newUser = await storage.upsertUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        lastName,
        passwordHash,
        role,
        company,
        phone,
        approvalStatus: 'approved',
        isActive: true,
        approvedBy: (req.user as any)?.id,
        approvedAt: new Date()
      });

      res.json({ 
        success: true, 
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Get current user route
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        approvalStatus: user.approvalStatus,
        company: user.company,
        phone: user.phone
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Change password route
  app.post('/api/change-password', isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req.user as any)?.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required' });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await storage.updateUser(userId, { passwordHash: newPasswordHash });

      res.json({ success: true });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Password change failed' });
    }
  });

  // Reset password route (admin only)
  app.post('/api/reset-password', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        return res.status(400).json({ error: 'User ID and new password are required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password
      await storage.updateUser(userId, { passwordHash });

      res.json({ success: true });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const isAdmin: RequestHandler = (req, res, next) => {
  if ((req.user as any)?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
};