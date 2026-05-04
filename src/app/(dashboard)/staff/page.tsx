"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import instance from "@/lib/axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateStaffSchema } from "@/lib/validation/auth";
import { z } from "zod";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Users,
  ShieldCheck,
  UserCircle2,
  Crown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  role: "OWNER" | "MANAGER" | "CASHIER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

type CreateStaffData = z.infer<typeof CreateStaffSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RoleBadge = ({ role }: { role: StaffMember["role"] }) => {
  const styles = {
    OWNER: "bg-primary/10 text-primary",
    MANAGER: "bg-blue-500/10 text-blue-500",
    CASHIER: "bg-foreground/8 text-foreground/60",
  };
  const icons = {
    OWNER: <Crown size={11} />,
    MANAGER: <ShieldCheck size={11} />,
    CASHIER: <UserCircle2 size={11} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[role]}`}
    >
      {icons[role]}
      {role}
    </span>
  );
};

const inputCls = (error?: boolean) =>
  `w-full rounded-xl border py-2.5 px-3 text-sm bg-background text-foreground outline-none transition focus:ring-2 ${
    error
      ? "border-red-400 focus:ring-red-400/20"
      : "border-foreground/15 focus:border-primary focus:ring-primary/20"
  }`;

// ─── Add Staff Modal ──────────────────────────────────────────────────────────

const AddStaffModal = ({
  shopId,
  onClose,
  onSaved,
}: {
  shopId: string;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffData>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: { role: "CASHIER" },
  });

  const onSubmit = async (data: CreateStaffData) => {
    setServerError(null);
    try {
      await instance.post("/staff", { ...data, shopId });
      onSaved();
    } catch (err: any) {
      setServerError(
        err.response?.data?.error || "Failed to add staff member.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-2xl border border-foreground/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/8">
          <h2 className="text-sm font-semibold text-foreground">
            Add Staff Member
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-foreground/8 text-foreground/50 hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Jane Wanjiru"
              className={inputCls(!!errors.name)}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="jane@example.com"
              className={inputCls(!!errors.email)}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Phone
            </label>
            <input
              {...register("phone")}
              placeholder="07XXXXXXXX"
              className={inputCls(false)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="Min. 8 characters"
              className={inputCls(!!errors.password)}
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Role <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["CASHIER", "MANAGER"] as const).map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 rounded-xl border border-foreground/15 px-3 py-2.5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
                >
                  <input
                    type="radio"
                    value={r}
                    {...register("role")}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">
                    {r}
                  </span>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-medium text-foreground/60 hover:bg-foreground/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                "Add Staff"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Remove Confirm Modal ─────────────────────────────────────────────────────

const RemoveModal = ({
  member,
  shopId,
  onClose,
  onRemoved,
}: {
  member: StaffMember;
  shopId: string;
  onClose: () => void;
  onRemoved: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setLoading(true);
    try {
      await instance.delete(`/staff/${member.id}?shopId=${shopId}`);
      onRemoved();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not remove staff member.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-foreground/10 shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Remove Staff Member
            </h2>
            <p className="text-sm text-foreground/50 mt-1">
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {member.user.name}
              </span>{" "}
              from your shop? They will lose access immediately.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-medium text-foreground/60 hover:bg-foreground/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              "Remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const { shopId, role, user } = useAuthStore();
  const isOwner = role === "OWNER" || role === "MANAGER";

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);

  // inside StaffPage(), before the return:
  const router = useRouter();

  useEffect(() => {
    if (role && role !== "OWNER" && role !== "MANAGER") {
      router.replace("/overview");
    }
  }, [role]);

  const fetchStaff = async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/staff?shopId=${shopId}`);
      setStaff(res.data.data.staff ?? []);
    } catch {
      setError("Failed to load staff.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [shopId]);

  return (
    <>
      {showAddModal && shopId && (
        <AddStaffModal
          shopId={shopId}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchStaff();
          }}
        />
      )}
      {removeTarget && shopId && (
        <RemoveModal
          member={removeTarget}
          shopId={shopId}
          onClose={() => setRemoveTarget(null)}
          onRemoved={() => {
            setRemoveTarget(null);
            fetchStaff();
          }}
        />
      )}

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Staff
            </h1>
            <p className="text-sm text-foreground/50 mt-0.5">
              {staff.length} member{staff.length !== 1 ? "s" : ""} in your shop
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} />
              Add Staff
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-foreground/10 bg-background overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl bg-foreground/8 h-14"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchStaff}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={32} className="mx-auto text-foreground/20 mb-3" />
              <p className="text-sm text-foreground/40">No staff members yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-foreground/40 uppercase tracking-wider border-b border-foreground/8">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  {isOwner && (
                    <th className="px-6 py-3 font-medium text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/6">
                {staff.map((member) => {
                  const isCurrentUser = member.user.id === user?.id;
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-foreground/3 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {member.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">
                            {member.user.name}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs text-foreground/30">
                                (you)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground/60">
                        {member.user.email}
                      </td>
                      <td className="px-6 py-4 text-foreground/60">
                        {member.user.phone ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-6 py-4 text-foreground/50 text-xs">
                        {format(parseISO(member.joinedAt), "d MMM yyyy")}
                      </td>
                      {isOwner && (
                        <td className="px-6 py-4 text-right">
                          {!isCurrentUser && member.role !== "OWNER" && (
                            <button
                              onClick={() => setRemoveTarget(member)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
