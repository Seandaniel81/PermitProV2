import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated, isAdmin } from "./local-auth";
import { healthMonitor } from "./health-monitor";
import { config } from "./config";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertPermitPackageSchema, 
  updatePermitPackageSchema,
  insertDocumentSchema,
  updateDocumentSchema,
  insertSettingSchema,
  updateSettingSchema,
  PACKAGE_STATUSES,
  DEFAULT_BUILDING_PERMIT_DOCS
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Create unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
  });

  const upload = multer({ 
    storage: storage_multer,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow common document types
      const allowedTypes = /\.(pdf|jpg|jpeg|png|gif|doc|docx|xls|xlsx|txt)$/i;
      if (allowedTypes.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only documents and images are allowed.'));
      }
    }
  });

  // Auth middleware
  await setupLocalAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Settings routes (admin only)
  app.get('/api/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get('/api/settings/category/:category', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await storage.getSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updateSettingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid setting data", 
          errors: validation.error.errors 
        });
      }

      const updatedSetting = await storage.updateSetting(id, {
        ...validation.data,
        updatedBy: req.dbUser.id,
      });
      
      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }

      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/pending', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const pendingUsers = users.filter(user => user.approvalStatus === 'pending');
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post('/api/users/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const updatedUser = await storage.updateUser(id, {
        approvalStatus: 'approved',
        approvedBy: req.dbUser.id,
        approvedAt: new Date(),
        rejectionReason: null,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post('/api/users/:id/reject', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const updatedUser = await storage.updateUser(id, {
        approvalStatus: 'rejected',
        approvedBy: req.dbUser.id,
        approvedAt: new Date(),
        rejectionReason: reason || 'No reason provided',
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Get all packages with statistics
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await storage.getAllPackages();
      const stats = await storage.getPackageStats();
      
      // Apply filters if provided
      let filteredPackages = packages;
      
      const { status, permitType, search } = req.query;
      
      if (status && status !== 'all') {
        filteredPackages = filteredPackages.filter(pkg => pkg.status === status);
      }
      
      if (permitType && permitType !== 'all') {
        filteredPackages = filteredPackages.filter(pkg => pkg.permitType === permitType);
      }
      
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredPackages = filteredPackages.filter(pkg => 
          pkg.projectName.toLowerCase().includes(searchTerm) ||
          pkg.address.toLowerCase().includes(searchTerm) ||
          pkg.clientName?.toLowerCase().includes(searchTerm)
        );
      }
      
      res.json({ packages: filteredPackages, stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  // Get single package with documents
  app.get("/api/packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }

      const packageWithDocuments = await storage.getPackageWithDocuments(id);
      if (!packageWithDocuments) {
        return res.status(404).json({ message: "Package not found" });
      }

      res.json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch package" });
    }
  });

  // Create new package
  app.post("/api/packages", async (req, res) => {
    try {
      const validation = insertPermitPackageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid package data", 
          errors: validation.error.errors 
        });
      }

      const packageData = validation.data;
      const newPackage = await storage.createPackage(packageData);

      // Add default documents for building permits
      if (packageData.permitType === "Building Permit") {
        for (const docTemplate of DEFAULT_BUILDING_PERMIT_DOCS) {
          await storage.createDocument({
            packageId: newPackage.id,
            documentName: docTemplate.documentName,
            isRequired: docTemplate.isRequired,
            isCompleted: 0,
          });
        }
      }

      const packageWithDocuments = await storage.getPackageWithDocuments(newPackage.id);
      res.status(201).json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  // Update package
  app.patch("/api/packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }

      const validation = updatePermitPackageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: validation.error.errors 
        });
      }

      const updatedPackage = await storage.updatePackage(id, validation.data);
      if (!updatedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      const packageWithDocuments = await storage.getPackageWithDocuments(id);
      res.json(packageWithDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to update package" });
    }
  });

  // Delete package
  app.delete("/api/packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }

      const deleted = await storage.deletePackage(id);
      if (!deleted) {
        return res.status(404).json({ message: "Package not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // Update document
  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const validation = updateDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid document data", 
          errors: validation.error.errors 
        });
      }

      const updatedDocument = await storage.updateDocument(id, validation.data);
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Add document to package
  app.post("/api/packages/:packageId/documents", async (req, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }

      // Check if package exists
      const packageExists = await storage.getPackage(packageId);
      if (!packageExists) {
        return res.status(404).json({ message: "Package not found" });
      }

      const validation = insertDocumentSchema.safeParse({
        ...req.body,
        packageId
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid document data", 
          errors: validation.error.errors 
        });
      }

      const newDocument = await storage.createDocument(validation.data);
      res.status(201).json(newDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to add document" });
    }
  });

  // Get package statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getPackageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Upload file to document
  app.post("/api/documents/:id/upload", upload.single('file'), async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const updatedDocument = await storage.updateDocument(documentId, {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        isCompleted: 1, // Mark as completed when file is uploaded
      });

      if (!updatedDocument) {
        // Clean up uploaded file if document not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(updatedDocument);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Download/view file
  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);
      if (!document || !document.filePath) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check if file exists on disk
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Delete uploaded file
  app.delete("/api/documents/:id/file", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete file from disk if it exists
      if (document.filePath && fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      // Update document to remove file info
      const updatedDocument = await storage.updateDocument(documentId, {
        fileName: null,
        fileSize: null,
        filePath: null,
        mimeType: null,
        isCompleted: 0, // Mark as incomplete when file is removed
      });

      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Health monitoring endpoints
  app.get('/api/health', async (req, res) => {
    try {
      const health = await healthMonitor.checkHealth();
      const status = healthMonitor.isHealthy() ? 200 : 503;
      res.status(status).json(health);
    } catch (error) {
      res.status(503).json({
        database: { connected: false, responseTime: 0, error: 'Health check failed' },
        storage: { uploadsWritable: false, backupsWritable: false, diskSpace: { total: 0, free: 0, used: 0, percentage: 0 } },
        system: { uptime: process.uptime(), memory: { used: 0, total: 0, percentage: 0 } },
        lastCheck: new Date(),
      });
    }
  });

  // System status endpoint (admin only)
  app.get('/api/system/status', isAdmin, async (req, res) => {
    try {
      const health = await healthMonitor.checkHealth();
      const systemInfo = {
        ...health,
        config: {
          environment: config.server.environment,
          databaseHost: config.database.host,
          uploadsDirectory: config.uploads.directory,
          backupDirectory: config.backup.directory,
          maxFileSize: config.uploads.maxFileSize,
          autoBackup: config.backup.autoBackup,
        },
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
      };
      res.json(systemInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get system status' });
    }
  });

  // Database backup endpoint (admin only)
  app.post('/api/system/backup', isAdmin, async (req, res) => {
    try {
      const { execSync } = require('child_process');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(config.backup.directory, `permits_backup_${timestamp}.sql`);
      
      // Ensure backup directory exists
      if (!fs.existsSync(config.backup.directory)) {
        fs.mkdirSync(config.backup.directory, { recursive: true });
      }

      const dbUrl = new URL(config.database.url);
      const env = { ...process.env, PGPASSWORD: dbUrl.password };

      execSync(`pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port || 5432} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -f ${backupFile}`, {
        env,
        stdio: 'pipe'
      });

      const stats = fs.statSync(backupFile);
      res.json({
        success: true,
        backupFile,
        size: stats.size,
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Backup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  const httpServer = createServer(app);
  return httpServer;
}
