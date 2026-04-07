/**
 * Zustand auth store persisted to localStorage.
 * Persisting means the user stays logged in across page refreshes
 * without needing a refresh token flow — sufficient for a prototype.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      login: (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    { name: "logsentinel-auth" }
  )
);
