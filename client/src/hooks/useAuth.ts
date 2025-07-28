import { useQuery } from "@tanstack/react-query";

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
  referralCode?: string;
  preferredAuthMethod?: string;
  lastAuthMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}