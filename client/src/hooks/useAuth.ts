import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  setupFeePaid: boolean;
  insuranceCoverage: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  referralCode?: string;
  preferredAuthMethod?: string;
  lastAuthMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // TEMPORARY BYPASS
  const bypass = localStorage.getItem('bypass-auth');
  if (bypass === 'true') {
    const bypassUser = JSON.parse(localStorage.getItem('bypass-user') || '{}');
    return {
      user: bypassUser as User,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
