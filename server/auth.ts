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

  // Development bypass for OIDC issues
  if (config.server.environment === 'development' && 
      (config.auth.clientId === 'your-client-id' || config.auth.clientSecret === 'your-client-secret')) {
    console.warn("⚠️  DEVELOPMENT MODE: OIDC not configured, using development bypass");
    
    app.get("/api/dev-login", async (req, res) => {
      const devUser = await storage.getUser("dev-admin") || await storage.upsertUser({
        id: "dev-admin",
        email: "dev@localhost",
        firstName: "Development",
        lastName: "Admin",
        role: "admin",
        approvalStatus: "approved",
        isActive: true
      });
      
      req.login({ claims: { sub: "dev-admin", email: "dev@localhost" }, expires_at: Math.floor(Date.now() / 1000) + 86400 }, (err) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        res.redirect("/");
      });
    });
    
    app.get("/api/login", (req, res) => {
      res.redirect("/api/dev-login");
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
    const strategy = new Strategy(
      {
        name: `oidc:${domain}`,
        config: oidcConfig,
        scope: "openid email profile",
        callbackURL: `${config.server.environment === 'production' ? 'https' : 'http'}://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const strategyName = `oidc:${req.hostname}`;
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const strategyName = `oidc:${req.hostname}`;
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

  if (!req.isAuthenticated() || !user.expires_at) {
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