import { create } from "zustand";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  shopId: string | null;
  role: string | null;
  setAuth: (
    token: string,
    user: AuthUser,
    shopId: string,
    role: string,
  ) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  shopId: null,
  role: null,
  setAuth: (token, user, shopId, role) => set({ token, user, shopId, role }),
  clearAuth: () => set({ token: null, user: null, shopId: null, role: null }),
}));
