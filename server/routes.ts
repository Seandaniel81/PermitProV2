import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
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

  // Auth middleware - use OIDC
  await setupAuth(app);

  // Dashboard route - redirect authenticated users here
  app.get('/dashboard', isAuthenticated, async (req, res) => {
    const packages = await storage.getAllPackages();
    const stats = await storage.getPackageStats();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Permit Management Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; background: #f8fafc; }
          .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; }
          .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
          .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-number { font-size: 2rem; font-weight: bold; color: #1e40af; }
          .stat-label { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
          .packages { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .packages-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: between; align-items: center; }
          .btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block; }
          .btn:hover { background: #2563eb; }
          .package-grid { display: grid; gap: 1rem; padding: 1.5rem; }
          .package-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; }
          .package-title { font-weight: 600; margin-bottom: 0.5rem; }
          .package-meta { font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem; }
          .status { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
          .status-draft { background: #f3f4f6; color: #374151; }
          .status-in-progress { background: #fef3c7; color: #92400e; }
          .status-ready { background: #d1fae5; color: #065f46; }
          .status-submitted { background: #dbeafe; color: #1e40af; }
          .progress-bar { background: #e5e7eb; height: 4px; border-radius: 2px; margin-top: 0.5rem; }
          .progress-fill { background: #3b82f6; height: 100%; border-radius: 2px; }
          .logout { color: #dc2626; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
            <h1>Permit Management System</h1>
            <a href="/api/logout" class="logout">Logout</a>
          </div>
        </div>
        
        <div class="container">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${stats.total}</div>
              <div class="stat-label">Total Packages</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.draft}</div>
              <div class="stat-label">Draft</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.inProgress}</div>
              <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.readyToSubmit}</div>
              <div class="stat-label">Ready to Submit</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.submitted}</div>
              <div class="stat-label">Submitted</div>
            </div>
          </div>
          
          <div class="packages">
            <div class="packages-header">
              <h2>Recent Packages</h2>
              <a href="/create-package" class="btn">New Package</a>
            </div>
            <div class="package-grid">
              ${packages.slice(0, 10).map(pkg => `
                <div class="package-card">
                  <div class="package-title">${pkg.projectName}</div>
                  <div class="package-meta">
                    ${pkg.permitType} • ${pkg.address}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                    <span class="status status-${pkg.status.replace(/\s+/g, '-').toLowerCase()}">${pkg.status}</span>
                    <span style="font-size: 0.75rem; color: #64748b;">
                      ${pkg.completedDocuments}/${pkg.totalDocuments} docs
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${pkg.progressPercentage}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // Landing page - redirect authenticated users to dashboard
  app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect('/dashboard');
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Permit Tracker</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container { 
            text-align: center; 
            background: white; 
            padding: 3rem; 
            border-radius: 12px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          h1 { margin-bottom: 1rem; color: #1f2937; }
          p { margin-bottom: 2rem; color: #6b7280; }
          .btn { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            text-decoration: none; 
            display: inline-block;
            font-size: 16px;
            font-weight: 500;
          }
          .btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Permit Package Tracker</h1>
          <p>Streamline your building permit process with comprehensive package management.</p>
          <a href="/api/login" class="btn">Sign In</a>
        </div>
      </body>
      </html>
    `);
  });

  // Serve uploaded files
  app.get('/api/files/:filename', isAuthenticated, (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(uploadsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileExtension = path.extname(filename).toLowerCase();
      
      // Set appropriate content type
      let contentType = 'application/octet-stream';
      if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
      } else if (['.jpg', '.jpeg'].includes(fileExtension)) {
        contentType = 'image/jpeg';
      } else if (fileExtension === '.png') {
        contentType = 'image/png';
      } else if (fileExtension === '.gif') {
        contentType = 'image/gif';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ message: 'Error serving file' });
    }
  });

  // OAuth configuration test endpoint
  app.get("/api/oauth-status", (req, res) => {
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;
    const useDevAuth = process.env.USE_DEV_AUTH;
    
    res.json({
      clientIdConfigured: clientId && clientId !== 'your-client-id',
      clientSecretConfigured: clientSecret && clientSecret !== 'your-client-secret',
      developmentMode: useDevAuth === 'true',
      expectedRedirectURI: 'http://localhost:5000/api/callback',
      currentHostname: req.hostname,
      allowedDomains: process.env.ALLOWED_DOMAINS?.split(',') || [],
      instructions: {
        step1: "Go to Google Cloud Console (console.cloud.google.com)",
        step2: "Navigate to APIs & Services > Credentials", 
        step3: "Find your OAuth 2.0 Client ID",
        step4: "Add this exact redirect URI: http://localhost:5000/api/callback",
        step5: "Set USE_DEV_AUTH=false in .env to test real OAuth"
      }
    });
  });

  // Auth routes are handled by simple-auth.ts

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  // Settings routes
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
        updatedBy: req.user.id,
      });
      
      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }

      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // User management routes
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
        approvedBy: (req as any).user.id,
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
        approvedBy: (req as any).user.id,
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
  app.get("/api/packages", isAuthenticated, async (req, res) => {
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
  app.get("/api/packages/:id", isAuthenticated, async (req, res) => {
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
  app.post("/api/packages", isAuthenticated, async (req, res) => {
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
  app.patch("/api/packages/:id", isAuthenticated, async (req, res) => {
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
  app.delete("/api/packages/:id", isAuthenticated, async (req, res) => {
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
  app.patch("/api/documents/:id", isAuthenticated, async (req, res) => {
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
  app.post("/api/packages/:packageId/documents", isAuthenticated, async (req, res) => {
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
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getPackageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Upload file to document
  app.post("/api/documents/:id/upload", isAuthenticated, upload.single('file'), async (req, res) => {
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
  app.get("/api/documents/:id/download", isAuthenticated, async (req, res) => {
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
  app.delete("/api/documents/:id/file", isAuthenticated, async (req, res) => {
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

  // Network file sharing endpoints
  app.get('/api/network/share/:packageId', async (req, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }

      const packageWithDocuments = await storage.getPackageWithDocuments(packageId);
      if (!packageWithDocuments) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Create shareable package info with file URLs
      const shareablePackage = {
        ...packageWithDocuments,
        documents: packageWithDocuments.documents.map(doc => ({
          ...doc,
          fileUrl: doc.fileName ? `/api/files/${doc.fileName}` : null
        })),
        shareUrl: `${req.protocol}://${req.get('host')}/api/network/share/${packageId}`,
        accessTime: new Date().toISOString()
      };

      res.json(shareablePackage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create network share" });
    }
  });

  // List all shared packages for network discovery
  app.get('/api/network/packages', async (req, res) => {
    try {
      const packages = await storage.getAllPackages();
      const networkPackages = packages.map(pkg => ({
        id: pkg.id,
        projectName: pkg.projectName,
        status: pkg.status,
        permitType: pkg.permitType,
        totalDocuments: pkg.totalDocuments,
        completedDocuments: pkg.completedDocuments,
        progressPercentage: pkg.progressPercentage,
        shareUrl: `${req.protocol}://${req.get('host')}/api/network/share/${pkg.id}`,
        lastUpdated: pkg.updatedAt
      }));

      res.json({
        packages: networkPackages,
        serverInfo: {
          host: req.get('host'),
          timestamp: new Date().toISOString(),
          totalPackages: packages.length
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to list network packages" });
    }
  });

  // Bulk download endpoint for network sharing
  app.get('/api/network/download/:packageId', async (req, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) {
        return res.status(400).json({ message: "Invalid package ID" });
      }

      const packageWithDocuments = await storage.getPackageWithDocuments(packageId);
      if (!packageWithDocuments) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Create a simple JSON response with all file information
      const downloadPackage = {
        package: packageWithDocuments,
        files: packageWithDocuments.documents
          .filter(doc => doc.fileName)
          .map(doc => ({
            documentName: doc.documentName,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            downloadUrl: `${req.protocol}://${req.get('host')}/api/files/${doc.fileName}`,
            mimeType: doc.mimeType
          })),
        downloadInfo: {
          packageName: packageWithDocuments.projectName,
          totalFiles: packageWithDocuments.documents.filter(doc => doc.fileName).length,
          generatedAt: new Date().toISOString()
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="package-${packageId}-files.json"`);
      res.json(downloadPackage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create download package" });
    }
  });

  // System status endpoint
  app.get('/api/system/status', async (req, res) => {
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
