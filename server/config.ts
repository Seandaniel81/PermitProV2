import { z } from 'zod';
import { randomBytes } from 'crypto';

// Generate a secure session secret if none is provided
function generateSecureSecret(): string {
  return randomBytes(32).toString('hex');
}

// Configuration schema for validation
const configSchema = z.object({
  // Database configuration
  database: z.object({
    url: z.string().url(),
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(5432),
    name: z.string().min(1),
    user: z.string().min(1),
    password: z.string().min(1),
    ssl: z.boolean().default(false),
    maxConnections: z.number().int().min(1).default(10),
  }),
  
  // Server configuration
  server: z.object({
    port: z.number().int().min(1).max(65535).default(5000),
    host: z.string().default('0.0.0.0'),
    environment: z.enum(['development', 'production', 'test']).default('development'),
  }),
  
  // Security configuration
  security: z.object({
    sessionSecret: z.string().min(1).default('default-session-secret-change-in-production'),
    sessionMaxAge: z.number().int().min(1).default(7 * 24 * 60 * 60 * 1000), // 7 days
    cors: z.object({
      origin: z.string().or(z.array(z.string())).default('*'),
      credentials: z.boolean().default(true),
    }),
  }),
  
  // File upload configuration
  uploads: z.object({
    directory: z.string().default('./uploads'),
    maxFileSize: z.number().int().min(1).default(10 * 1024 * 1024), // 10MB
    allowedTypes: z.array(z.string()).default([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]),
  }),
  
  // Backup configuration
  backup: z.object({
    directory: z.string().default('./backups'),
    retentionDays: z.number().int().min(1).default(30),
    autoBackup: z.boolean().default(true),
    backupInterval: z.number().int().min(1).default(24), // hours
  }),
  
  // Authentication configuration
  auth: z.object({
    issuerUrl: z.string().url().default('https://replit.com/oidc'),
    replId: z.string().min(1).default('standalone'),
    domains: z.array(z.string()).min(1).default(['localhost']),
  }),
});

export type Config = z.infer<typeof configSchema>;

// Load configuration from environment variables
export function loadConfig(): Config {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const dbUrl = new URL(databaseUrl);
  
  const rawConfig = {
    database: {
      url: databaseUrl,
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port) || 5432,
      name: dbUrl.pathname.slice(1),
      user: dbUrl.username,
      password: dbUrl.password,
      ssl: process.env.DATABASE_SSL === 'true',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
    },
    
    server: {
      port: parseInt(process.env.PORT || '5000'),
      host: process.env.HOST || '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    
    security: {
      sessionSecret: process.env.SESSION_SECRET || generateSecureSecret(),
      sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || (7 * 24 * 60 * 60 * 1000).toString()),
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: process.env.CORS_CREDENTIALS !== 'false',
      },
    },
    
    uploads: {
      directory: process.env.UPLOAD_DIR || './uploads',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || (10 * 1024 * 1024).toString()),
      allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
    },
    
    backup: {
      directory: process.env.BACKUP_DIR || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      autoBackup: process.env.AUTO_BACKUP !== 'false',
      backupInterval: parseInt(process.env.BACKUP_INTERVAL_HOURS || '24'),
    },
    
    auth: {
      issuerUrl: process.env.ISSUER_URL || 'https://replit.com/oidc',
      replId: process.env.REPL_ID || 'standalone',
      domains: process.env.REPLIT_DOMAINS?.split(',') || ['localhost'],
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw new Error('Invalid configuration. Please check your environment variables.');
  }
}

// Get current configuration
export const config = loadConfig();