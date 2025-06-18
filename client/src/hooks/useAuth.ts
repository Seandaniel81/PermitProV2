import type { User } from "@shared/schema";

// Standalone mode - no authentication required
export function useAuth() {
  const user: User = {
    id: 'standalone-user',
    email: 'user@local',
    firstName: 'Standalone',
    lastName: 'User',
    role: 'admin',
    company: 'Local Company',
    phone: '',
    profileImageUrl: null,
    approvalStatus: 'approved',
    isActive: true,
    passwordHash: null,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null
  };
  
  return {
    user,
    isLoading: false,
    isAuthenticated: true,
    needsApproval: false,
    isRejected: false,
    isAdmin: true,
    error: '',
  };
}