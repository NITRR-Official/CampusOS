import { create } from 'zustand';

// Assuming AuthResponseData and UserRole shapes based on auth-api.ts
import type { AuthResponseData, UserRole } from '@campus-os/shared/auth-types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: AuthResponseData | null;
  user: AuthResponseData['user'] | null;
  accessToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;

  // Actions
  setStatus: (status: AuthStatus) => void;
  setAuthSession: (session: AuthResponseData | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  user: null,
  accessToken: null,
  role: null,
  isAuthenticated: false,

  setStatus: (status) => set({ status }),

  setAuthSession: (session) => {
    if (!session || !session.accessToken || !session.user) {
      set({
        status: 'unauthenticated',
        session: null,
        user: null,
        accessToken: null,
        role: null,
        isAuthenticated: false
      });
      return;
    }

    set({
      status: 'authenticated',
      session,
      user: session.user,
      accessToken: session.accessToken,
      role: session.user.role || null,
      isAuthenticated: true
    });
  },

  clearAuth: () => {
    set({
      status: 'unauthenticated',
      session: null,
      user: null,
      accessToken: null,
      role: null,
      isAuthenticated: false
    });
  }
}));
