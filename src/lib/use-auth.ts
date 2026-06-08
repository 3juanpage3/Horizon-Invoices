import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSession, loginUser, logoutUser, registerUser } from "@/lib/api/auth.functions";
import type { AuthUser } from "@/lib/settings";

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: () => getSession(),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (input: { usernameOrEmail: string; password: string }) =>
      loginUser({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

  const registerMutation = useMutation({
    mutationFn: (input: { username: string; email: string; password: string }) =>
      registerUser({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutUser(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const user: AuthUser | null = sessionQuery.data?.user ?? null;

  return {
    user,
    isAuthenticated: !!user,
    hasCompany: sessionQuery.data?.hasCompany ?? false,
    loaded: sessionQuery.isFetched,
    isLoading: sessionQuery.isLoading,
    login: (usernameOrEmail: string, password: string) =>
      loginMutation.mutateAsync({ usernameOrEmail, password }),
    register: (username: string, email: string, password: string) =>
      registerMutation.mutateAsync({ username, email, password }),
    logout: () => logoutMutation.mutateAsync(),
    loginError: loginMutation.error?.message ?? registerMutation.error?.message ?? null,
    isSubmitting: loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
  };
}
