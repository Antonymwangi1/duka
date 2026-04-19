"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import instance from "@/lib/axios";
import axios from "axios";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log("1. token in memory:", token);

      if (token) {
        setIsLoading(false);
        return;
      }

      try {
        const refreshRes = await instance.post("/auth/refresh");

        const accessToken = refreshRes.data.data.accessToken;

        const meRes = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });

        const user = meRes.data.data.user;
        setAuth(accessToken, user);
        setIsLoading(false);
      } catch (error: any) {
        clearAuth();
        router.push("/login");
      }
    };

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
};
