import { create } from "zustand";
import { IUser } from "@equipment-rental/shared-types";
import { apiClient } from "@/lib/api-client";

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  setAuth: (user: IUser, accessToken: string, refreshToken: string) => void;
  updateUser: (user: IUser) => void;
  logout: () => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  hasHydrated: false,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      // Set cookie for Next.js middleware route protection
      document.cookie = `auth_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    }

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
      hasHydrated: true,
    });
  },

  updateUser: (updatedUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      document.cookie = `user_role=${updatedUser.role}; path=/; max-age=604800; SameSite=Lax`;
    }
    set({ user: updatedUser });
  },

  logout: async () => {
    const refreshToken = get().refreshToken || (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null);

    if (refreshToken) {
      try {
        await apiClient.post("/auth/logout", { refreshToken });
      } catch {
        // Ignore logout network errors and clean local state
      }
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: true,
    });
  },

  initializeAuth: () => {
    if (typeof window === "undefined") return;

    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userJson = localStorage.getItem("user");

      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson) as IUser;
        document.cookie = `auth_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `user_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          hasHydrated: true,
        });
      } else {
        document.cookie = "auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          hasHydrated: true,
        });
      }
    } catch {
      document.cookie = "auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        hasHydrated: true,
      });
    }
  },
}));
