import 'dotenv/config';

// Force SQLite database for local development BEFORE importing storage
if (process.env.FORCE_LOCAL_AUTH === 'true') {
  process.env.DATABASE_URL = 'file:./permit_system.db';
  console.log('Forced SQLite database for local development');
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed-database";
import { config } from "./config";
import { setupAuth } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Skip seeding for SQLite - admin user created manually
  if (!process.env.DATABASE_URL?.includes('file:')) {
    await seedDatabase();
  } else {
    console.log("Using SQLite with manual admin user setup");
  }
  
  // Register authentication routes FIRST to ensure they take priority over frontend routing
  if (process.env.FORCE_LOCAL_AUTH === 'true') {
    const { setupLocalAuth } = await import('./local-auth');
    await setupLocalAuth(app);
    console.log('Pre-registered local SQLite authentication routes');
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Error:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use configured port or default to 5000
  const port = config.server.port;
  const host = config.server.host;
  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
