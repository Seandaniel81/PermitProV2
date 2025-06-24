import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./dual-auth";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      await storage.getPackageStats();
      res.json({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'unhealthy', 
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
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
          role: newUser.role,
          isActive: newUser.isActive,
          approvalStatus: newUser.approvalStatus
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.put('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated directly
      delete updates.passwordHash;
      delete updates.id;
      delete updates.createdAt;

      const updatedUser = await storage.updateUser(id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.post('/api/admin/users/:id/reset-password', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const newPassword = await storage.resetUserPassword(id);
      res.json({ success: true, newPassword });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).dbUser;

      if (id === currentUser.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Instead of deleting, deactivate the user
      const updatedUser = await storage.updateUser(id, { isActive: false });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating user:', error);
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  });

  // Package management routes
  app.get('/api/packages', isAuthenticated, async (req, res) => {
    try {
      const packages = await storage.getAllPackages();
      res.json(packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ error: 'Failed to fetch packages' });
    }
  });

  app.get('/api/packages/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const pkg = await storage.getPackageWithDocuments(parseInt(id));
      
      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }

      res.json(pkg);
    } catch (error) {
      console.error('Error fetching package:', error);
      res.status(500).json({ error: 'Failed to fetch package' });
    }
  });

  app.post('/api/packages', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).dbUser;
      const packageData = {
        ...req.body,
        createdBy: user.id,
      };

      const newPackage = await storage.createPackage(packageData);
      res.json({ success: true, package: newPackage });
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ error: 'Failed to create package' });
    }
  });

  app.put('/api/packages/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedPackage = await storage.updatePackage(parseInt(id), updates);
      
      if (!updatedPackage) {
        return res.status(404).json({ error: 'Package not found' });
      }

      res.json({ success: true, package: updatedPackage });
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ error: 'Failed to update package' });
    }
  });

  app.delete('/api/packages/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).dbUser;

      const pkg = await storage.getPackage(parseInt(id));
      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Only allow deletion by creator or admin
      if (pkg.createdBy !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const success = await storage.deletePackage(parseInt(id));
      
      if (!success) {
        return res.status(500).json({ error: 'Failed to delete package' });
      }

      res.json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
      console.error('Error deleting package:', error);
      res.status(500).json({ error: 'Failed to delete package' });
    }
  });

  // Document upload routes
  app.post('/api/packages/:id/documents', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const { id } = req.params;
      const { documentName, isRequired } = req.body;
      const file = req.file;
      const user = (req as any).dbUser;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const pkg = await storage.getPackage(parseInt(id));
      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Move file to permanent location
      const fileName = `${Date.now()}_${file.originalname}`;
      const permanentPath = path.join(uploadDir, fileName);
      fs.renameSync(file.path, permanentPath);

      const documentData = {
        packageId: parseInt(id),
        documentName: documentName || file.originalname,
        isRequired: parseInt(isRequired) || 0,
        isCompleted: 1,
        fileName: file.originalname,
        fileSize: file.size,
        filePath: permanentPath,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };

      const document = await storage.createDocument(documentData);
      res.json({ success: true, document });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  // Settings routes
  app.get('/api/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = (req as any).dbUser;

      updates.updatedBy = user.id;

      const updatedSetting = await storage.updateSetting(parseInt(id), updates);
      
      if (!updatedSetting) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      res.json({ success: true, setting: updatedSetting });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  // Statistics routes
  app.get('/api/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getPackageStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Admin dashboard routes
  app.get('/admin/users', isAuthenticated, isAdmin, (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>User Management - Permit System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; background: #f8fafc; }
          .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; }
          .nav { background: white; border-bottom: 1px solid #e2e8f0; }
          .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; gap: 2rem; }
          .nav a { padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent; }
          .nav a.active { color: #3b82f6; border-bottom-color: #3b82f6; }
          .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
          .users-table { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
          .table-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
          .btn { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; }
          .btn:hover { background: #2563eb; }
          .btn-danger { background: #dc2626; }
          .btn-danger:hover { background: #b91c1c; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: 600; color: #374151; }
          .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
          .status-active { background: #dcfce7; color: #166534; }
          .status-inactive { background: #fef2f2; color: #991b1b; }
          .role-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
          .role-admin { background: #fef3c7; color: #92400e; }
          .role-user { background: #e0e7ff; color: #3730a3; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Permit Management System</h1>
        </div>
        
        <nav class="nav">
          <div class="nav-inner">
            <a href="/dashboard">Dashboard</a>
            <a href="/admin/users" class="active">User Management</a>
            <a href="/admin/packages">Package Management</a>
            <a href="/admin/settings">Settings</a>
            <a href="#" onclick="logout()">Logout</a>
          </div>
        </nav>
        
        <div class="container">
          <div class="users-table">
            <div class="table-header">
              <h2>User Management</h2>
              <button class="btn" onclick="showCreateUserModal()">Add New User</button>
            </div>
            
            <table id="usersTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Company</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="7" style="text-align: center; padding: 2rem;">Loading users...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Create User Modal -->
        <div id="createUserModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px;">
            <h3>Create New User</h3>
            <form id="createUserForm" style="margin-top: 1rem;">
              <div style="margin-bottom: 1rem;">
                <label>Email:</label>
                <input type="email" name="email" required style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 1rem;">
                <label>Password:</label>
                <input type="password" name="password" required style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 1rem;">
                <label>First Name:</label>
                <input type="text" name="firstName" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 1rem;">
                <label>Last Name:</label>
                <input type="text" name="lastName" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 1rem;">
                <label>Role:</label>
                <select name="role" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style="margin-bottom: 1rem;">
                <label>Company:</label>
                <input type="text" name="company" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
              </div>
              <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button type="button" onclick="hideCreateUserModal()" class="btn" style="background: #6b7280;">Cancel</button>
                <button type="submit" class="btn">Create User</button>
              </div>
            </form>
          </div>
        </div>

        <script>
          let users = [];

          async function loadUsers() {
            try {
              const response = await fetch('/api/admin/users');
              users = await response.json();
              renderUsers();
            } catch (error) {
              console.error('Error loading users:', error);
            }
          }

          function renderUsers() {
            const tbody = document.querySelector('#usersTable tbody');
            tbody.innerHTML = users.map(user => \`
              <tr>
                <td>\${user.firstName || ''} \${user.lastName || ''}</td>
                <td>\${user.email}</td>
                <td><span class="role-badge role-\${user.role}">\${user.role}</span></td>
                <td><span class="status-badge status-\${user.isActive ? 'active' : 'inactive'}">\${user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>\${user.company || '-'}</td>
                <td>\${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn" onclick="resetPassword('\${user.id}')" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Reset Password</button>
                  <button class="btn-danger btn" onclick="toggleUserStatus('\${user.id}', \${user.isActive})" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; margin-left: 0.5rem;">
                    \${user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            \`).join('');
          }

          function showCreateUserModal() {
            document.getElementById('createUserModal').style.display = 'block';
          }

          function hideCreateUserModal() {
            document.getElementById('createUserModal').style.display = 'none';
            document.getElementById('createUserForm').reset();
          }

          document.getElementById('createUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userData = Object.fromEntries(formData);

            try {
              const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
              });

              const result = await response.json();
              
              if (result.success) {
                hideCreateUserModal();
                loadUsers();
                alert('User created successfully');
              } else {
                alert(result.error || 'Failed to create user');
              }
            } catch (error) {
              alert('Error creating user');
            }
          });

          async function resetPassword(userId) {
            if (!confirm('Reset password for this user?')) return;

            try {
              const response = await fetch(\`/api/admin/users/\${userId}/reset-password\`, {
                method: 'POST'
              });

              const result = await response.json();
              
              if (result.success) {
                alert(\`Password reset successfully. New password: \${result.newPassword}\`);
              } else {
                alert('Failed to reset password');
              }
            } catch (error) {
              alert('Error resetting password');
            }
          }

          async function toggleUserStatus(userId, isActive) {
            const action = isActive ? 'deactivate' : 'activate';
            if (!confirm(\`\${action.charAt(0).toUpperCase() + action.slice(1)} this user?\`)) return;

            try {
              const response = await fetch(\`/api/admin/users/\${userId}\`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive })
              });

              const result = await response.json();
              
              if (result.success) {
                loadUsers();
                alert(\`User \${action}d successfully\`);
              } else {
                alert(\`Failed to \${action} user\`);
              }
            } catch (error) {
              alert(\`Error \${action}ing user\`);
            }
          }

          async function logout() {
            try {
              await fetch('/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            } catch (error) {
              window.location.href = '/login';
            }
          }

          // Load users on page load
          loadUsers();
        </script>
      </body>
      </html>
    `);
  });

  app.get('/dashboard', isAuthenticated, (req, res) => {
    const user = (req as any).dbUser;
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard - Permit Management System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; background: #f8fafc; }
          .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
          .nav { background: white; border-bottom: 1px solid #e2e8f0; }
          .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; gap: 2rem; }
          .nav a { padding: 1rem 0; color: #64748b; text-decoration: none; border-bottom: 2px solid transparent; }
          .nav a.active { color: #3b82f6; border-bottom-color: #3b82f6; }
          .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
          .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-number { font-size: 2rem; font-weight: bold; color: #1f2937; }
          .stat-label { color: #6b7280; margin-top: 0.5rem; }
          .welcome { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
          .btn { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; }
          .btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Permit Management System</h1>
          <div>
            Welcome, ${user.firstName || user.email} 
            <button class="btn" onclick="logout()" style="margin-left: 1rem;">Logout</button>
          </div>
        </div>
        
        <nav class="nav">
          <div class="nav-inner">
            <a href="/dashboard" class="active">Dashboard</a>
            ${user.role === 'admin' ? '<a href="/admin/users">User Management</a>' : ''}
            ${user.role === 'admin' ? '<a href="/admin/packages">Package Management</a>' : ''}
            ${user.role === 'admin' ? '<a href="/admin/settings">Settings</a>' : ''}
          </div>
        </nav>
        
        <div class="container">
          <div class="welcome">
            <h2>Welcome to the Permit Management System</h2>
            <p>Manage building permits, track document completion, and streamline the approval process.</p>
            <p><strong>Database:</strong> PostgreSQL | <strong>Authentication:</strong> Local + GitHub OAuth | <strong>Server:</strong> Apache + Bun</p>
          </div>
          
          <div class="stats-grid" id="statsGrid">
            <div class="stat-card">
              <div class="stat-number">Loading...</div>
              <div class="stat-label">Loading statistics...</div>
            </div>
          </div>
        </div>

        <script>
          async function loadStats() {
            try {
              const response = await fetch('/api/stats');
              const stats = await response.json();
              
              document.getElementById('statsGrid').innerHTML = \`
                <div class="stat-card">
                  <div class="stat-number">\${stats.total}</div>
                  <div class="stat-label">Total Packages</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">\${stats.draft}</div>
                  <div class="stat-label">Draft Packages</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">\${stats.inProgress}</div>
                  <div class="stat-label">In Progress</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">\${stats.submitted}</div>
                  <div class="stat-label">Submitted</div>
                </div>
              \`;
            } catch (error) {
              console.error('Error loading stats:', error);
            }
          }

          async function logout() {
            try {
              await fetch('/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            } catch (error) {
              window.location.href = '/login';
            }
          }

          loadStats();
        </script>
      </body>
      </html>
    `);
  });

  const httpServer = createServer(app);
  return httpServer;
}