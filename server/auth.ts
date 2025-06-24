import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { config } from "./config";

const getOidcConfig = memoize(
  async () => {
    console.log('Setting up OIDC with issuer:', config.auth.issuerUrl);
    console.log('Client ID:', config.auth.clientId);
    return await client.discovery(
      new URL(config.auth.issuerUrl),
      config.auth.clientId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = config.security.sessionMaxAge;
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
      secure: config.server.environment === "production",
      maxAge: sessionTtl,
      sameSite: config.server.environment === "production" ? "none" : "lax",
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const existingUser = await storage.getUser(claims["sub"]);
  
  if (!existingUser) {
    // New user - create with pending approval status unless auto-approval is enabled
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["given_name"] || claims["first_name"] || claims["name"]?.split(" ")[0] || "User",
      lastName: claims["family_name"] || claims["last_name"] || claims["name"]?.split(" ").slice(1).join(" ") || "",
      profileImageUrl: claims["picture"] || claims["profile_image_url"],
      approvalStatus: config.auth.autoApprove ? "approved" : "pending",
      role: "user",
    });
  } else {
    // Existing user - update profile info but keep approval status and role
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["given_name"] || claims["first_name"] || existingUser.firstName,
      lastName: claims["family_name"] || claims["last_name"] || existingUser.lastName,
      profileImageUrl: claims["picture"] || claims["profile_image_url"] || existingUser.profileImageUrl,
      approvalStatus: existingUser.approvalStatus,
      role: existingUser.role,
    });
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Check if we should use local authentication instead of OIDC
  if (process.env.FORCE_LOCAL_AUTH === 'true') {
    console.log('FORCE_LOCAL_AUTH enabled - skipping OIDC setup entirely');
    const { setupLocalAuth } = await import('./local-auth');
    return setupLocalAuth(app);
  }

  // Development bypass and fallback for OIDC issues
  const useDevBypass = config.auth.clientId === 'your-client-id' || 
                       config.auth.clientSecret === 'your-client-secret' ||
                       process.env.USE_DEV_AUTH === 'true';
  
  if (useDevBypass) {
    console.warn("⚠️  LOCAL DEVELOPMENT MODE: Using secure local authentication");
    
    // Create multiple test users for comprehensive testing
    const testUsers = [
      {
        id: "admin-user",
        email: "admin@localhost",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        approvalStatus: "approved",
        isActive: true
      },
      {
        id: "regular-user",
        email: "user@localhost", 
        firstName: "Regular",
        lastName: "User",
        role: "user",
        approvalStatus: "approved",
        isActive: true
      },
      {
        id: "contractor-user",
        email: "contractor@localhost",
        firstName: "Contractor", 
        lastName: "User",
        role: "user",
        approvalStatus: "approved",
        isActive: true,
        company: "ABC Construction"
      }
    ];

    // User selection and login endpoint
    app.get("/api/local-login", async (req, res) => {
      const userId = req.query.user as string || "admin-user";
      
      try {
        let user = await storage.getUser(userId);
        if (!user) {
          const userData = testUsers.find(u => u.id === userId) || testUsers[0];
          user = await storage.upsertUser(userData);
        }
        
        const sessionUser = { 
          claims: { 
            sub: user.id, 
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            given_name: user.firstName,
            family_name: user.lastName
          }, 
          expires_at: Math.floor(Date.now() / 1000) + 86400 
        };
        
        req.login(sessionUser, (err) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ error: "Login failed", details: err.message });
          }
          console.log(`Local login successful for ${user.email}, redirecting to dashboard`);
          res.redirect("/dashboard");
        });
      } catch (error) {
        console.error("Local login error:", error);
        res.status(500).json({ error: "Authentication failed", details: error instanceof Error ? error.message : String(error) });
      }
    });

    // User selection page
    app.get("/api/login", (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Local Development Login</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh; 
              margin: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
            }
            .container { 
              background: white; 
              padding: 2rem; 
              border-radius: 12px; 
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 500px; 
              width: 100%;
            }
            h1 { margin-bottom: 1rem; color: #1f2937; text-align: center; }
            .subtitle { color: #6b7280; text-align: center; margin-bottom: 2rem; }
            .user-option { 
              display: block; 
              width: 100%; 
              padding: 1rem; 
              margin-bottom: 0.5rem; 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              text-decoration: none; 
              color: #1f2937;
              transition: all 0.2s;
            }
            .user-option:hover { 
              background: #3b82f6; 
              color: white; 
              border-color: #3b82f6; 
            }
            .user-name { font-weight: 600; }
            .user-details { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
            .user-option:hover .user-details { color: rgba(255,255,255,0.8); }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Development Login</h1>
            <p class="subtitle">Select a user to test different roles and permissions</p>
            
            <a href="/api/local-login?user=admin-user" class="user-option">
              <div class="user-name">Admin User</div>
              <div class="user-details">admin@localhost • Full system access</div>
            </a>
            
            <a href="/api/local-login?user=regular-user" class="user-option">
              <div class="user-name">Regular User</div>
              <div class="user-details">user@localhost • Standard user permissions</div>
            </a>
            
            <a href="/api/local-login?user=contractor-user" class="user-option">
              <div class="user-name">Contractor User</div>
              <div class="user-details">contractor@localhost • ABC Construction</div>
            </a>
          </div>
        </body>
        </html>
      `);
    });
    
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        req.session.destroy((err) => {
          if (err) console.error("Session destruction error:", err);
          res.clearCookie('connect.sid');
          res.redirect("/");
        });
      });
    });

    // Setup passport serialization for development mode
    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });
    
    return;
  }

  let oidcConfig;
  try {
    oidcConfig = await getOidcConfig();
  } catch (error) {
    console.error("Failed to get OIDC configuration:", error);
    throw new Error("OIDC configuration failed. Please check your OIDC_ISSUER_URL and credentials.");
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of config.auth.domains) {
    // Use HTTPS for production domains, HTTP for localhost
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const callbackURL = `${protocol}://${domain}/api/callback`;
    
    const strategy = new Strategy(
      {
        name: `oidc:${domain}`,
        config: oidcConfig,
        scope: "openid email profile",
        callbackURL,
      },
      verify,
    );
    passport.use(strategy);
    console.log(`Configured OAuth strategy for domain: ${domain}, callback: ${callbackURL}`);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Handle localhost with port mapping
    const hostname = req.hostname === 'localhost' ? 'localhost:5000' : req.hostname;
    const strategyName = `oidc:${hostname}`;
    console.log(`Login attempt for hostname: ${req.hostname}, mapped to: ${hostname}, strategy: ${strategyName}`);
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Handle localhost with port mapping
    const hostname = req.hostname === 'localhost' ? 'localhost:5000' : req.hostname;
    const strategyName = `oidc:${hostname}`;
    console.log(`Callback for hostname: ${req.hostname}, mapped to: ${hostname}, strategy: ${strategyName}`);
    
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        res.clearCookie('connect.sid');
        if (config.auth.logoutUrl) {
          res.redirect(config.auth.logoutUrl);
        } else {
          res.redirect("/");
        }
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Development bypass mode - skip expiration check
  if (process.env.USE_DEV_AUTH === 'true') {
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (!dbUser.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }
    
    if (dbUser.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Account not approved" });
    }
    
    (req as any).dbUser = dbUser;
    return next();
  }

  // Production mode - check token expiration
  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    // Check user approval status
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (!dbUser.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }
    
    if (dbUser.approvalStatus === "rejected") {
      return res.status(403).json({ 
        message: "Account access denied", 
        reason: dbUser.rejectionReason || "Your account has been rejected by an administrator" 
      });
    }
    
    if (dbUser.approvalStatus === "pending") {
      return res.status(403).json({ 
        message: "Account pending approval", 
        reason: "Your account is awaiting administrator approval" 
      });
    }
    
    if (dbUser.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Account not approved" });
    }
    
    (req as any).dbUser = dbUser;
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const oidcConfig = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(oidcConfig, refreshToken);
    updateUserSession(user, tokenResponse);
    
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser || dbUser.approvalStatus !== "approved" || !dbUser.isActive) {
      return res.status(403).json({ message: "Account not approved" });
    }
    
    (req as any).dbUser = dbUser;
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const dbUser = await storage.getUser(user.claims.sub);
  if (!dbUser || dbUser.role !== 'admin' || !dbUser.isActive) {
    return res.status(403).json({ message: "Admin access required" });
  }

  (req as any).dbUser = dbUser;
  next();
};