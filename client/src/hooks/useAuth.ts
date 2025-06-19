import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Parse error message from server response
  let errorMessage = "";
  if (error) {
    const errorString = error.toString();
    // Extract JSON from error message like "403: {"message":"Account pending approval","reason":"..."}"
    const jsonMatch = errorString.match(/\d+:\s*({.*})/);
    if (jsonMatch) {
      try {
        const errorData = JSON.parse(jsonMatch[1]);
        errorMessage = errorData.message || "";
      } catch (e) {
        // Fallback to extracting simple message
        const simpleMatch = errorString.match(/\d+:\s*(.+)/);
        errorMessage = simpleMatch ? simpleMatch[1] : errorString;
      }
    } else {
      errorMessage = errorString;
    }
  }

  // Check if user needs approval or is rejected
  const needsApproval = errorMessage.includes("Account pending approval");
  const isRejected = errorMessage.includes("Account access denied");
  const isUnauthorized = errorMessage.includes("401") || errorMessage.includes("Unauthorized");

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isUnauthorized,
    needsApproval,
    isRejected,
    isAdmin: user?.role === 'admin',
    error: errorMessage,
  };
}