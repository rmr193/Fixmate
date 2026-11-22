'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { UserProfile } from '@/types';
import {
  apiFetch,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: (
    callbackURL?: string,
    role?: 'customer' | 'technician'
  ) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'technician';
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
  updateUserState: (updatedUser: UserProfile, newToken?: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AppProviders');
  }
  return ctx;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateUserState = useCallback(
    (updatedUser: UserProfile, newToken?: string) => {
      setUser(updatedUser);
      setStoredUser(updatedUser);
      if (newToken) {
        setToken(newToken);
        setStoredToken(newToken);
      }
    },
    []
  );

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const existingToken = getStoredToken();
      if (existingToken) {
        const res = await apiFetch<{ token: string; user: UserProfile }>(
          '/api/auth/me',
          { token: existingToken }
        );
        updateUserState(res.data.user, res.data.token);
        return res.data.user;
      }

      // Fallback: check Next.js BetterAuth cookie session and exchange for JWT
      const pendingOAuthRole =
        typeof window !== 'undefined'
          ? localStorage.getItem('fixmate_pending_oauth_role')
          : null;
      if (pendingOAuthRole && typeof window !== 'undefined') {
        localStorage.removeItem('fixmate_pending_oauth_role');
      }

      const tokenEndpoint =
        pendingOAuthRole === 'technician' || pendingOAuthRole === 'customer'
          ? `/api/auth/token?oauth_role=${encodeURIComponent(pendingOAuthRole)}`
          : '/api/auth/token';

      const tokenRes = await fetch(tokenEndpoint, {
        credentials: 'include',
      });
      if (tokenRes.ok) {
        const json = await tokenRes.json();
        if (json?.success && json?.data?.user && json?.data?.token) {
          updateUserState(json.data.user, json.data.token);
          return json.data.user;
        }
      }

      setUser(null);
      setToken(null);
      setStoredToken(null);
      setStoredUser(null);
      return null;
    } catch {
      setUser(null);
      setToken(null);
      setStoredToken(null);
      setStoredUser(null);
      return null;
    }
  }, [updateUserState]);

  useEffect(() => {
    let mounted = true;
    const cachedUser = getStoredUser<UserProfile>();
    const cachedToken = getStoredToken();
    if (cachedUser && cachedToken) {
      setUser(cachedUser);
      setToken(cachedToken);
    }

    refreshUser().finally(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      // Authenticate against Express API for immediate JWT + sync BetterAuth cookie session
      const res = await apiFetch<{ token: string; user: UserProfile }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      // Establish BetterAuth browser session cookie in background
      try {
        await authClient.signIn.email({
          email,
          password,
        });
      } catch {
        // Express JWT is already verified and active
      }

      updateUserState(res.data.user, res.data.token);
      return res.data.user;
    },
    [updateUserState]
  );

  const loginWithGoogle = useCallback(
    async (
      callbackURL = '/dashboard',
      role?: 'customer' | 'technician'
    ) => {
      // Clear any previous local JWT so the post-OAuth redirect exchanges the new Google session cookie
      setStoredToken(null);
      setStoredUser(null);
      if (typeof window !== 'undefined') {
        if (role === 'technician' || role === 'customer') {
          localStorage.setItem('fixmate_pending_oauth_role', role);
        } else {
          localStorage.removeItem('fixmate_pending_oauth_role');
        }
      }

      const response = await fetch('/api/auth/sign-in/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          provider: 'google',
          callbackURL,
        }),
      });

    let data: { url?: string; message?: string; error?: string } | null = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.url) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Google Sign-In request failed (HTTP ${response.status}).`
      );
    }

    window.location.href = data.url;
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      role: 'customer' | 'technician';
    }): Promise<UserProfile> => {
      const safeRole =
        payload.role === 'technician' ? 'technician' : 'customer';

      const res = await apiFetch<{ token: string; user: UserProfile }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ ...payload, role: safeRole }),
        }
      );

      try {
        await authClient.signIn.email({
          email: payload.email,
          password: payload.password,
        });
      } catch {
        // Express JWT is already issued
      }

      updateUserState(res.data.user, res.data.token);
      return res.data.user;
    },
    [updateUserState]
  );

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore if cookie already cleared
    }
    setUser(null);
    setToken(null);
    setStoredToken(null);
    setStoredUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user,
            token,
            isLoading,
            login,
            loginWithGoogle,
            register,
            logout,
            refreshUser,
            updateUserState,
          }}
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: 'font-sans',
            }}
          />
        </AuthContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
