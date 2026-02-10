import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthResponse, TokenPair } from "@nexus/shared";
import { AUTH_ROUTES } from "@nexus/shared";
import { api, ApiError } from "@/lib/api";

interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  isLoading: boolean;
  error: string | null;

  register: (username: string, password: string, displayName?: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      error: null,

      register: async (username, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<AuthResponse>(AUTH_ROUTES.REGISTER, {
            username,
            password,
            displayName,
          });
          api.setAccessToken(data.tokens.accessToken);
          set({ user: data.user, tokens: data.tokens, isLoading: false });
        } catch (e) {
          const message = e instanceof ApiError ? e.message : "Registration failed";
          set({ isLoading: false, error: message });
          throw e;
        }
      },

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<AuthResponse>(AUTH_ROUTES.LOGIN, {
            username,
            password,
          });
          api.setAccessToken(data.tokens.accessToken);
          set({ user: data.user, tokens: data.tokens, isLoading: false });
        } catch (e) {
          const message = e instanceof ApiError ? e.message : "Login failed";
          set({ isLoading: false, error: message });
          throw e;
        }
      },

      logout: () => {
        api.setAccessToken(null);
        set({ user: null, tokens: null, error: null });
      },

      refresh: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) return;

        try {
          const data = await api.post<AuthResponse>(AUTH_ROUTES.REFRESH, {
            refreshToken: tokens.refreshToken,
          });
          api.setAccessToken(data.tokens.accessToken);
          set({ user: data.user, tokens: data.tokens });
        } catch {
          // Refresh failed — log out
          api.setAccessToken(null);
          set({ user: null, tokens: null });
        }
      },

      fetchMe: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) return;

        api.setAccessToken(tokens.accessToken);
        try {
          const data = await api.get<{ user: User }>(AUTH_ROUTES.ME);
          set({ user: data.user });
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            // Try refresh
            await get().refresh();
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "nexus-auth",
      partialize: (state) => ({ tokens: state.tokens, user: state.user }),
    },
  ),
);
