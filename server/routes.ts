import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
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
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  const httpServer = createServer(app);
  return httpServer;
}
