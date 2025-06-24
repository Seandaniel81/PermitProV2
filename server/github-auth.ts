import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const PgSession = connectPg(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl / 1000, // Convert to seconds
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

export async function setupGitHubAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure GitHub strategy
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL || "/auth/github/callback",
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const userId = `github_${profile.id}`;
        const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
        
        let user = await storage.getUser(userId);
        
        if (!user) {
          // Create new user
          user = await storage.upsertUser({
            id: userId,
            email,
            firstName: profile.displayName?.split(' ')[0] || profile.username,
            lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: profile.photos?.[0]?.value,
            role: 'user',
            isActive: true,
            approvalStatus: 'approved', // GitHub users auto-approved
          });
        } else {
          // Update existing user
          user = await storage.updateUser(userId, {
            email,
            firstName: profile.displayName?.split(' ')[0] || profile.username,
            lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: profile.photos?.[0]?.value,
            lastLoginAt: new Date(),
          }) || user;
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

  // Auth routes
  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login?error=github_failed' }),
    (req, res) => {
      res.redirect('/dashboard');
    }
  );

  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
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