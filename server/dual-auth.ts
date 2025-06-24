import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const PgSession = connectPg(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl / 1000,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupDualAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use('local', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is disabled' });
        }

        if (user.approvalStatus !== 'approved') {
          return done(null, false, { message: 'Account pending approval' });
        }

        // Update last login
        await storage.updateUser(user.id, { lastLoginAt: new Date() });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // GitHub Strategy (if configured)
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use('github', new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || "/auth/github/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const userId = `github_${profile.id}`;
          const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
          
          let user = await storage.getUser(userId);
          
          if (!user) {
            user = await storage.upsertUser({
              id: userId,
              email,
              firstName: profile.displayName?.split(' ')[0] || profile.username,
              lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
              profileImageUrl: profile.photos?.[0]?.value,
              role: 'user',
              isActive: true,
              approvalStatus: 'approved',
            });
          } else {
            user = await storage.updateUser(userId, {
              lastLoginAt: new Date(),
            }) || user;
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    ));

    // GitHub auth routes
    app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
    
    app.get('/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/login?error=github_failed' }),
      (req, res) => {
        res.redirect('/dashboard');
      }
    );
  }

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

  // Local auth routes
  app.get('/login', (req, res) => {
    const hasGitHub = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login - Permit Management System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
          }
          .login-container {
            background: white; border-radius: 12px; padding: 2rem; width: 100%; max-width: 400px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
          .logo { text-align: center; margin-bottom: 2rem; }
          .logo h1 { color: #4f46e5; font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
          .logo p { color: #6b7280; font-size: 0.875rem; }
          .form-group { margin-bottom: 1rem; }
          label { display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500; }
          input { 
            width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;
            font-size: 1rem; transition: border-color 0.2s;
          }
          input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
          button { 
            width: 100%; background: #4f46e5; color: white; padding: 0.75rem; border: none;
            border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer;
            transition: background-color 0.2s;
          }
          button:hover { background: #4338ca; }
          .divider { 
            margin: 1.5rem 0; text-align: center; position: relative;
            color: #6b7280; font-size: 0.875rem;
          }
          .divider::before {
            content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px;
            background: #e5e7eb; z-index: 1;
          }
          .divider span { background: white; padding: 0 1rem; position: relative; z-index: 2; }
          .github-btn {
            background: #24292e; color: white; display: flex; align-items: center; justify-content: center;
            gap: 0.5rem; text-decoration: none; padding: 0.75rem; border-radius: 6px;
            font-weight: 600; transition: background-color 0.2s;
          }
          .github-btn:hover { background: #1b1f23; }
          .error { 
            background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
            padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem;
          }
          .info {
            background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8;
            padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem;
          }
        </style>
      </head>
      <body>
        <div class="login-container">
          <div class="logo">
            <h1>Permit System</h1>
            <p>Building Permit Management</p>
          </div>
          
          <div id="error" class="error" style="display: none;"></div>
          
          <div class="info">
            <strong>Default Admin:</strong><br>
            Email: admin@localhost<br>
            Password: admin123
          </div>
          
          <form id="loginForm">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" name="email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            <button type="submit">Sign In</button>
          </form>
          
          ${hasGitHub ? `
            <div class="divider">
              <span>or</span>
            </div>
            <a href="/auth/github" class="github-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </a>
          ` : ''}
        </div>
        
        <script>
          const urlParams = new URLSearchParams(window.location.search);
          const error = urlParams.get('error');
          if (error) {
            const errorDiv = document.getElementById('error');
            errorDiv.style.display = 'block';
            errorDiv.textContent = error === 'github_failed' ? 'GitHub authentication failed' : 'Login failed';
          }
          
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('error');
            errorDiv.style.display = 'none';
            
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            
            try {
              const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              
              const result = await response.json();
              
              if (result.success) {
                window.location.href = '/dashboard';
              } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = result.message || 'Login failed';
              }
            } catch (error) {
              errorDiv.style.display = 'block';
              errorDiv.textContent = 'Network error. Please try again.';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  app.post('/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Authentication error' });
      }
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: info?.message || 'Invalid credentials' 
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Login failed' });
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

  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Admin user registration route
  app.post('/auth/register', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role = 'user', company, phone } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newUser = await storage.upsertUser({
        id: userId,
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        company,
        phone,
        isActive: true,
        approvalStatus: 'approved',
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
  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    const user = (req as any).dbUser || req.user;
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
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    try {
      const userId = (req.user as any).id;
      const dbUser = await storage.getUser(userId);
      
      if (dbUser && dbUser.isActive) {
        (req as any).dbUser = dbUser;
        return next();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = (req as any).dbUser || req.user;
  
  if (user && user.role === 'admin') {
    return next();
  }
  
  res.status(403).json({ message: "Admin access required" });
};