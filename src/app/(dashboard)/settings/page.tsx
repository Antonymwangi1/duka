"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import instance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Loader2, Store, Save } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  currency: string;
  plan: string;
  defaultLowStockThreshold: number;
}

const inputCls =
  "w-full rounded-xl border border-foreground/15 bg-background py-2.5 px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

export default function SettingsPage() {
  const { shopId, role, setShopName } = useAuthStore();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    defaultLowStockThreshold: 5,
  });

  useEffect(() => {
    if (role && role !== "OWNER") router.replace("/overview");
  }, [role]);

  useEffect(() => {
    if (!shopId) return;
    const fetch = async () => {
      try {
        const res = await instance.get(`/shop?shopId=${shopId}`);
        const s = res.data.data.shop;
        setShop(s);
        setForm({
          name: s.name,
          location: s.location ?? "",
          phone: s.phone ?? "",
          defaultLowStockThreshold: s.defaultLowStockThreshold,
        });
      } catch {
        setError("Failed to load shop settings.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [shopId]);

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await instance.patch("/shop", {
        shopId,
        name: form.name,
        location: form.location || undefined,
        phone: form.phone || undefined,
        defaultLowStockThreshold: Number(form.defaultLowStockThreshold),
      });
      const updated = res.data.data.shop;
      setShop(updated);
      setShopName(updated.name);
      setSuccess("Settings saved successfully.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Shop Settings
        </h1>
        <p className="text-sm text-foreground/50 mt-0.5">
          Update your shop details
        </p>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-background overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-foreground/8">
          <Store size={15} className="text-foreground/50" />
          <h2 className="text-sm font-semibold text-foreground">
            Shop Details
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Shop Name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wanjiru General Store"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Location
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Nairobi, Westlands"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="07XXXXXXXX"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Default Low Stock Threshold
            </label>
            <input
              type="number"
              min={1}
              value={form.defaultLowStockThreshold}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultLowStockThreshold: Number(e.target.value),
                })
              }
              className={inputCls}
            />
            <p className="text-xs text-foreground/40">
              Products with stock at or below this number will trigger low stock
              alerts
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-foreground/40">
              Plan:{" "}
              <span className="font-semibold text-foreground/60">
                {shop?.plan}
              </span>
              {" · "}Currency:{" "}
              <span className="font-semibold text-foreground/60">
                {shop?.currency}
              </span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
