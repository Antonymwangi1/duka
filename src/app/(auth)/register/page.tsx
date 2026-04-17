"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Store, Phone, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";

import instance from "@/lib/axios";
import { RegisterSchema } from "@/lib/validation/auth";

type RegisterFormData = z.infer<typeof RegisterSchema>;

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border py-3 pl-9 pr-4 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/20 ${
    hasError
      ? "border-red-400 focus:ring-red-400/20"
      : "border-foreground/15 focus:border-primary"
  }`;

const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await instance.post("/auth/register", data);
      router.push("/login");
    } catch (error: any) {
      setServerError(
        error.response?.data?.error || "Registration failed. Please try again.",
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
            Set up your shop in under 2 minutes.
          </p>
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-50 mb-3">
                Free plan includes
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Up to 50 products",
                  "Unlimited sales recording",
                  "Daily & weekly reports",
                ].map((f) => (
                  <li key={f} className="opacity-80">
                    — {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest opacity-50 mb-3">
                Upgrade anytime
              </p>
              <ul className="space-y-3 text-sm">
                {["Basic — KES 500/month", "Pro — KES 1,500/month"].map((f) => (
                  <li key={f} className="opacity-80">
                    — {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
            <h2 className="text-3xl font-bold text-foreground">
              Create account
            </h2>
            <p className="text-sm text-foreground/60 mt-1">
              Register yourself and your shop.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Server error */}
            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Section: Your details */}
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
              Your details
            </p>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Full name
              </label>
              <div className="relative">
                <User size={16} className={iconClass} />
                <input
                  type="text"
                  placeholder="Antony Mwangi"
                  {...register("name")}
                  className={inputClass(!!errors.name)}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className={iconClass} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={inputClass(!!errors.email)}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Phone{" "}
                <span className="text-foreground/40 font-normal">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <Phone size={16} className={iconClass} />
                <input
                  type="tel"
                  placeholder="07xx xxx xxx"
                  {...register("phone")}
                  className={inputClass(!!errors.phone)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className={iconClass} />
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  {...register("password")}
                  className={inputClass(!!errors.password)}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Confirm password
              </label>
              <div className="relative">
                <Lock size={16} className={iconClass} />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={inputClass(!!errors.confirmPassword)}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Section: Shop details */}
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40 pt-2">
              Your shop
            </p>

            {/* Shop name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Shop name
              </label>
              <div className="relative">
                <Store size={16} className={iconClass} />
                <input
                  type="text"
                  placeholder="Mama Njeri's Shop"
                  {...register("shopName")}
                  className={inputClass(!!errors.shopName)}
                />
              </div>
              {errors.shopName && (
                <p className="text-xs text-red-500">
                  {errors.shopName.message}
                </p>
              )}
            </div>

            {/* Shop phone */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Shop phone{" "}
                <span className="text-foreground/40 font-normal">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <Phone size={16} className={iconClass} />
                <input
                  type="tel"
                  placeholder="07xx xxx xxx"
                  {...register("shopPhone")}
                  className={inputClass(!!errors.shopPhone)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Location{" "}
                <span className="text-foreground/40 font-normal">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <MapPin size={16} className={iconClass} />
                <input
                  type="text"
                  placeholder="Thika Town, Kiambu"
                  {...register("location")}
                  className={inputClass(!!errors.location)}
                />
              </div>
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
                "Create account"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-foreground/60">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
