import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check if user needs approval
  const needsApproval = error && (error as any).message === "Account pending approval";
  const isRejected = error && (error as any).message === "Account access denied";

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    needsApproval,
    isRejected,
    isAdmin: user?.role === 'admin',
  };
}