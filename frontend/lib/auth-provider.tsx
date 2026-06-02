'use client';

import * as React from 'react';

import type { AuthResponseData, UserRole } from './auth-api';
import {
  clearAuthSession,
  readAuthSession,
  subscribeAuthSession
} from './auth-session';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  session: AuthResponseData | null;
  user: AuthResponseData['user'] | null;
  accessToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  refreshSession: () => void;
  logout: () => void;
}

const VALID_ROLES: UserRole[] = ['admin', 'coordinator', 'volunteer'];

function isValidRole(role: string | null | undefined): role is UserRole {
  return !!role && VALID_ROLES.includes(role as UserRole);
}

function decodeBase64(value: string) {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      '='
    );
    return globalThis.atob(padded);
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string) {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const decoded = decodeBase64(parts[1]);
  if (!decoded) {
    return null;
  }

  try {
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
}

function normalizeSession(session: AuthResponseData | null) {
  if (!session?.accessToken || !session.user) {
    return null;
  }

  if (isTokenExpired(session.accessToken)) {
    return null;
  }

  if (!isValidRole(session.user.role)) {
    return null;
  }

  return session;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>('loading');
  const [session, setSession] = React.useState<AuthResponseData | null>(null);

  const refreshSession = React.useCallback(() => {
    const rawSession = readAuthSession();
    const normalized = normalizeSession(rawSession);

    if (!normalized) {
      if (rawSession) {
        clearAuthSession();
      }
      setSession(null);
      setStatus('unauthenticated');
      return;
    }

    setSession(normalized);
    setStatus('authenticated');
  }, []);

  React.useEffect(() => {
    refreshSession();
    return subscribeAuthSession(() => {
      refreshSession();
    });
  }, [refreshSession]);

  const logout = React.useCallback(() => {
    clearAuthSession();
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const value = React.useMemo(() => {
    const user = session?.user ?? null;
    const accessToken = session?.accessToken ?? null;
    const role = user?.role ?? null;
    const isAuthenticated =
      status === 'authenticated' && !!accessToken && !!user;

    const hasRole = (...roles: UserRole[]) => {
      if (!role) {
        return false;
      }
      if (roles.length === 0) {
        return true;
      }
      return roles.includes(role);
    };

    return {
      status,
      session,
      user,
      accessToken,
      role,
      isAuthenticated,
      hasRole,
      refreshSession,
      logout
    };
  }, [status, session, refreshSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
