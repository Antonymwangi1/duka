"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import instance from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginSchema } from "@/lib/validation/auth";

type LoginFormData = z.infer<typeof LoginSchema>;

const features = [
  "Real-time inventory tracking",
  "Daily sales & profit reports",
  "Multi-user staff management",
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await instance.post("/auth/login", data);
      const { accessToken, user, shopId, role } = response.data.data;
      setAuth(accessToken, user, shopId, role);
      router.push("/overview"); // dashboard is at (dashboard)/page.tsx → route is "/dashboard"
      router.refresh();
    } catch (error: any) {
      setServerError(
        error.response?.data?.error || "Login failed. Please try again.",
      );
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* LEFT PANEL */}
      <section className="hidden md:flex md:w-2/5 bg-sidebar flex-col justify-between p-12 text-sidebar-text">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Duka Manager</h1>
          <p className="text-lg opacity-80 mb-12">
            Run your shop smarter, not harder.
          </p>
          <ul className="space-y-5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <CheckCircle2
                  size={18}
                  className="text-primary-accent shrink-0"
                />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-40">
          © {new Date().getFullYear()} Duka Manager. All rights reserved.
        </p>
      </section>

      {/* RIGHT PANEL */}
      <section className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-foreground/60 mt-1">
              Enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Server error */}
            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={`w-full rounded-xl border py-3 pl-9 pr-4 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    errors.email
                      ? "border-red-400 focus:ring-red-400/20"
                      : "border-foreground/15 focus:border-primary"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full rounded-xl border py-3 pl-9 pr-4 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    errors.password
                      ? "border-red-400 focus:ring-red-400/20"
                      : "border-foreground/15 focus:border-primary"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-foreground/60">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
