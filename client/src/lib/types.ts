import { PackageWithDocuments, PermitPackage, PackageDocument } from "@shared/schema";

export type { PackageWithDocuments, PermitPackage, PackageDocument };

export interface PackageStats {
  total: number;
  draft: number;
  inProgress: number;
  readyToSubmit: number;
  submitted: number;
}

export interface PackagesResponse {
  packages: PackageWithDocuments[];
  stats: PackageStats;
}

export interface FilterOptions {
  status?: string;
  permitType?: string;
  search?: string;
}

export const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready_to_submit', label: 'Ready to Submit' },
  { value: 'submitted', label: 'Submitted' },
];

export const permitTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'Building Permit', label: 'Building Permit' },
  { value: 'Demolition Permit', label: 'Demolition Permit' },
  { value: 'Electrical Permit', label: 'Electrical Permit' },
  { value: 'Plumbing Permit', label: 'Plumbing Permit' },
  { value: 'Mechanical Permit', label: 'Mechanical Permit' },
  { value: 'Fire Permit', label: 'Fire Permit' },
  { value: 'Sign Permit', label: 'Sign Permit' },
  { value: 'Fence Permit', label: 'Fence Permit' },
];

export function getStatusDisplay(status: string): { label: string; className: string; icon: string } {
  switch (status) {
    case 'draft':
      return { label: 'Draft', className: 'status-draft', icon: 'fas fa-file' };
    case 'in_progress':
      return { label: 'In Progress', className: 'status-in_progress', icon: 'fas fa-clock' };
    case 'ready_to_submit':
      return { label: 'Ready to Submit', className: 'status-ready_to_submit', icon: 'fas fa-check-circle' };
    case 'submitted':
      return { label: 'Submitted', className: 'status-submitted', icon: 'fas fa-paper-plane' };
    default:
      return { label: status, className: 'status-draft', icon: 'fas fa-file' };
  }
}

export function formatCurrency(cents: number | null | undefined): string {
  if (!cents) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return 'Not set';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
