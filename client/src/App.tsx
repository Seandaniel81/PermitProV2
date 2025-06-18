import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import NewPackage from "@/pages/new-package";
import PackageDetail from "@/pages/package-detail";
import PackageEdit from "@/pages/package-edit";
import Settings from "@/pages/settings";
import UserManagement from "@/pages/user-management";
import SystemStatus from "@/pages/system-status";
import PendingApproval from "@/pages/pending-approval";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, needsApproval, isRejected } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show pending approval page if user needs admin approval
  if (needsApproval) {
    return <PendingApproval />;
  }

  // Show rejection message if user was rejected
  if (isRejected) {
    return <PendingApproval />; // Could create a separate rejection page if needed
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/new-package" component={NewPackage} />
          <Route path="/package/:id" component={PackageDetail} />
          <Route path="/package/:id/edit" component={PackageEdit} />
          <Route path="/settings" component={Settings} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/admin" component={Admin} />
          <Route path="/system-status" component={SystemStatus} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, needsApproval, isRejected } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Only show sidebar when user is fully authenticated */}
      {isAuthenticated && !needsApproval && !isRejected && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Router />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
