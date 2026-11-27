import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  role: string;
  hasPin: boolean;
  biometricsEnabled: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync("access_token", accessToken);
    await SecureStore.setItemAsync("refresh_token", refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user");
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const [token, refresh, userStr] = await Promise.all([
        SecureStore.getItemAsync("access_token"),
        SecureStore.getItemAsync("refresh_token"),
        SecureStore.getItemAsync("user"),
      ]);
      if (token && userStr) {
        set({
          accessToken: token,
          refreshToken: refresh,
          user: JSON.parse(userStr),
          isAuthenticated: true,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (updates) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...updates } : null;
      if (updated) SecureStore.setItemAsync("user", JSON.stringify(updated));
      return { user: updated };
    }),
}));
