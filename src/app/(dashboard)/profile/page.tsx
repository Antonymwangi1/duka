"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import instance from "@/lib/axios";
import { Loader2, User, Lock, Save } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-foreground/15 bg-background py-2.5 px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const res = await instance.patch("/profile", {
        name: profileForm.name,
        phone: profileForm.phone || undefined,
      });
      setUser(res.data.data.user);
      setProfileSuccess("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await instance.patch("/profile/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.error || "Failed to change password.",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-foreground/50 mt-0.5">
          Manage your account details
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-foreground">{user?.name}</p>
          <p className="text-sm text-foreground/50">{user?.email}</p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="rounded-2xl border border-foreground/10 bg-background overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-foreground/8">
          <User size={15} className="text-foreground/50" />
          <h2 className="text-sm font-semibold text-foreground">
            Personal Details
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {profileError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {profileSuccess}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              placeholder="Your full name"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Email Address
            </label>
            <input
              value={user?.email ?? ""}
              disabled
              className={`${inputCls} opacity-50 cursor-not-allowed`}
            />
            <p className="text-xs text-foreground/40">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Phone
            </label>
            <input
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
              placeholder="07XXXXXXXX"
              className={inputCls}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleProfileSave}
              disabled={profileSaving || !profileForm.name.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {profileSaving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-foreground/10 bg-background overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-foreground/8">
          <Lock size={15} className="text-foreground/50" />
          <h2 className="text-sm font-semibold text-foreground">
            Change Password
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {passwordError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {passwordSuccess}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Current Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              New Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              placeholder="Min. 8 characters"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Confirm New Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handlePasswordSave}
              disabled={
                passwordSaving ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword
              }
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {passwordSaving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Lock size={15} />
              )}
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
