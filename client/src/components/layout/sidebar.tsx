import { Link, useLocation } from "wouter";
import { FileText, FolderPlus, Archive, Settings, LayoutDashboard, LogOut, Users, Activity, Shield, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'New Package', href: '/new-package', icon: FolderPlus },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Archive', href: '/archive', icon: Archive },
  { name: 'Admin Panel', href: '/admin', icon: Shield },
  { name: 'User Management', href: '/user-management', icon: Users },
  { name: 'System Status', href: '/system-status', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (item.href === '/settings' || item.href === '/user-management' || item.href === '/system-status' || item.href === '/admin') {
      return isAdmin;
    }
    return true;
  });

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <FileText className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-xl font-semibold text-gray-900">PermitTracker Pro</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || 'S'}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {isAdmin && (
                  <Badge variant="default" className="text-xs">Admin</Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 hover:text-gray-900"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
