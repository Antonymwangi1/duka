import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  setAuth: (token: string, user: AuthState["user"]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
}));
