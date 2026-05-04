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
  shopName: string | null;
  setAuth: (
    token: string,
    user: AuthUser,
    shopId: string,
    role: string,
  ) => void;
  setShopName: (shopName: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  shopId: null,
  role: null,
  shopName: null,
  setAuth: (token, user, shopId, role) => set({ token, user, shopId, role }),
  setShopName: (shopName) => set({ shopName }),
  setUser: (user) => set({ user }),
  clearAuth: () =>
    set({ token: null, user: null, shopId: null, role: null, shopName: null }),
}));
