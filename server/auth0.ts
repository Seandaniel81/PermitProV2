import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as Auth0Strategy } from 'passport-auth0';
import { storage } from './storage';
import connectPg from 'connect-pg-simple';
import type { RequestHandler } from 'express';

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}

// Auth0 configuration
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  callbackURL: process.env.AUTH0_CALLBACK_URL || '/callback'
};

if (!auth0Config.domain || !auth0Config.clientID || !auth0Config.clientSecret) {
  throw new Error('Auth0 configuration missing. Please set AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET');
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
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

export async function setupAuth(app: express.Express) {
  // Trust proxy for production deployments
  app.set('trust proxy', 1);
  
  // Session middleware
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth0 Strategy
  const strategy = new Auth0Strategy(
    {
      domain: auth0Config.domain,
      clientID: auth0Config.clientID,
      clientSecret: auth0Config.clientSecret,
      callbackURL: auth0Config.callbackURL,
    },
    async function(accessToken: string, refreshToken: string, extraParams: any, profile: any, done: any) {
      try {
        // Extract user information from Auth0 profile
        const userInfo = {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName || profile.given_name,
          lastName: profile.name?.familyName || profile.family_name,
          profileImageUrl: profile.photos?.[0]?.value || profile.picture,
          provider: 'auth0'
        };

        // Upsert user in database
        const user = await storage.upsertUser(userInfo);
        done(null, user);
      } catch (error) {
        console.error('Auth0 authentication error:', error);
        done(error);
      }
    }
  );

  passport.use(strategy);

  // Serialize/Deserialize user for session
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
  app.get('/login', passport.authenticate('auth0', {
    scope: 'openid email profile'
  }), function(req, res) {
    res.redirect('/');
  });

  app.get('/callback', passport.authenticate('auth0', {
    failureRedirect: '/login'
  }), function(req, res) {
    const returnTo = (req.session as any)?.returnTo || '/dashboard';
    delete (req.session as any)?.returnTo;
    res.redirect(returnTo);
  });

  app.get('/logout', (req, res) => {
    req.logout(() => {
      const logoutURL = new URL(`https://${auth0Config.domain}/v2/logout`);
      logoutURL.searchParams.set('client_id', auth0Config.clientID);
      logoutURL.searchParams.set('returnTo', process.env.AUTH0_LOGOUT_URL || `${req.protocol}://${req.get('host')}`);
      res.redirect(logoutURL.toString());
    });
  });

  // API route to get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Store the URL they were trying to access
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    (req.session as any).returnTo = req.originalUrl;
  }
  
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  res.redirect('/login');
};

// Middleware to check if user is admin
export const isAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Store user in request for easy access
    req.dbUser = user;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};