// src/app/(dashboard)/inventory/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import instance from "@/lib/axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema } from "@/lib/validation/product";
import { z } from "zod";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Package,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductFormData = z.infer<typeof ProductSchema>;

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  buyingPrice: string;
  sellingPrice: string;
  stockQty: string;
  lowStockThreshold: number | null;
  isActive: boolean;
  category: Category | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOW_STOCK_FALLBACK = 5;

const fmt = (n: string | number) =>
  `KES ${Number(n).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const isLowStock = (p: Product) =>
  Number(p.stockQty) <= (p.lowStockThreshold ?? LOW_STOCK_FALLBACK);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-foreground/8 ${className}`} />
);

// ─── Input ────────────────────────────────────────────────────────────────────

const inputCls = (error?: boolean) =>
  `w-full rounded-xl border py-2.5 px-3 text-sm bg-background text-foreground outline-none transition focus:ring-2 ${
    error
      ? "border-red-400 focus:ring-red-400/20"
      : "border-foreground/15 focus:border-primary focus:ring-primary/20"
  }`;

// ─── Product Form Modal ────────────────────────────────────────────────────────

interface ProductModalProps {
  categories: Category[];
  shopId: string;
  editTarget: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

const ProductModal = ({
  categories,
  shopId,
  editTarget,
  onClose,
  onSaved,
}: ProductModalProps) => {
  const isEdit = !!editTarget;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: editTarget
      ? {
          name: editTarget.name,
          sku: editTarget.sku ?? "",
          unit: editTarget.unit,
          buyingPrice: Number(editTarget.buyingPrice),
          sellingPrice: Number(editTarget.sellingPrice),
          stockQty: Number(editTarget.stockQty),
          categoryId: editTarget.category?.id ?? "",
          imageUrl: "",
        }
      : { unit: "pcs", stockQty: 0 },
  });

  const onSubmit = async (data: ProductFormData) => {
    setServerError(null);
    try {
      const payload = {
        ...data,
        shopId,
        categoryId: data.categoryId || undefined,
        imageUrl: data.imageUrl || undefined,
      };

      if (isEdit) {
        await instance.patch(`/products/${editTarget.id}`, payload);
      } else {
        await instance.post("/products", payload);
      }

      onSaved();
    } catch (err: any) {
      setServerError(err.response?.data?.error || "Something went wrong.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background rounded-2xl border border-foreground/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/8">
          <h2 className="text-sm font-semibold text-foreground">
            {isEdit ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-foreground/8 text-foreground/50 hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Product Name <span className="text-red-400">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Unga Pembe 2kg"
              className={inputCls(!!errors.name)}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* SKU + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/60">
                SKU / Barcode
              </label>
              <input
                {...register("sku")}
                placeholder="optional"
                className={inputCls(!!errors.sku)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/60">
                Unit <span className="text-red-400">*</span>
              </label>
              <input
                {...register("unit")}
                placeholder="pcs, kg, litre…"
                className={inputCls(!!errors.unit)}
              />
              {errors.unit && (
                <p className="text-xs text-red-500">{errors.unit.message}</p>
              )}
            </div>
          </div>

          {/* Buying + Selling Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/60">
                Buying Price (KES) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("buyingPrice", { valueAsNumber: true })}
                placeholder="0.00"
                className={inputCls(!!errors.buyingPrice)}
              />
              {errors.buyingPrice && (
                <p className="text-xs text-red-500">
                  {errors.buyingPrice.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/60">
                Selling Price (KES) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("sellingPrice", { valueAsNumber: true })}
                placeholder="0.00"
                className={inputCls(!!errors.sellingPrice)}
              />
              {errors.sellingPrice && (
                <p className="text-xs text-red-500">
                  {errors.sellingPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Stock Qty + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/60">
                Stock Qty <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                {...register("stockQty", { valueAsNumber: true })}
                placeholder="0"
                className={inputCls(!!errors.stockQty)}
              />
              {errors.stockQty && (
                <p className="text-xs text-red-500">
                  {errors.stockQty.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/60">
                Category
              </label>
              <div className="relative">
                <select
                  {...register("categoryId")}
                  className={`${inputCls(false)} appearance-none pr-8`}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
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
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

interface DeleteModalProps {
  product: Product;
  shopId: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteModal = ({
  product,
  shopId,
  onClose,
  onDeleted,
}: DeleteModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setLoading(true);
    try {
      await instance.delete(`/products/${product.id}?shopId=${shopId}`);
      onDeleted();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not delete product.");
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
              Delete Product
            </h2>
            <p className="text-sm text-foreground/50 mt-1">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {product.name}
              </span>
              ? This action cannot be undone.
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
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { shopId, role } = useAuthStore();
  const canEdit = role === "OWNER" || role === "MANAGER";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchData = async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        instance.get(`/products?shopId=${shopId}`),
        instance.get(`/categories?shopId=${shopId}`),
      ]);
      setProducts(productsRes.data.data.products ?? []);
      setCategories(categoriesRes.data.data.categories ?? []);
    } catch {
      setError("Failed to load inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter
        ? p.category?.id === categoryFilter
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const handleSaved = () => {
    setShowAddModal(false);
    setEditTarget(null);
    fetchData();
  };

  const handleDeleted = () => {
    setDeleteTarget(null);
    fetchData();
  };

  return (
    <>
      {/* Modals */}
      {(showAddModal || editTarget) && shopId && (
        <ProductModal
          categories={categories}
          shopId={shopId}
          editTarget={editTarget}
          onClose={() => {
            setShowAddModal(false);
            setEditTarget(null);
          }}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && shopId && (
        <DeleteModal
          product={deleteTarget}
          shopId={shopId}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Inventory
            </h1>
            <p className="text-sm text-foreground/50 mt-0.5">
              {products.length} product{products.length !== 1 ? "s" : ""} in
              stock
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} />
              Add Product
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="w-full rounded-xl border border-foreground/15 bg-background py-2.5 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none rounded-xl border border-foreground/15 bg-background py-2.5 pl-3 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-foreground/10 bg-background overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchData}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={32} className="mx-auto text-foreground/20 mb-3" />
              <p className="text-sm text-foreground/40">
                {search || categoryFilter
                  ? "No products match your filters"
                  : "No products yet — add your first product"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-foreground/40 uppercase tracking-wider border-b border-foreground/8">
                    <th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">SKU</th>
                    <th className="px-6 py-3 font-medium">Unit</th>
                    <th className="px-6 py-3 font-medium">Buying</th>
                    <th className="px-6 py-3 font-medium">Selling</th>
                    <th className="px-6 py-3 font-medium">Stock</th>
                    {canEdit && (
                      <th className="px-6 py-3 font-medium text-right">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/6">
                  {filtered.map((product) => {
                    const low = isLowStock(product);
                    return (
                      <tr
                        key={product.id}
                        className={`transition-colors ${
                          low
                            ? "bg-amber-500/5 hover:bg-amber-500/8"
                            : "hover:bg-foreground/3"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {low && (
                              <AlertTriangle
                                size={13}
                                className="text-amber-500 shrink-0"
                              />
                            )}
                            <span className="font-medium text-foreground">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {product.category ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                background: product.category.color
                                  ? `${product.category.color}22`
                                  : "rgba(0,0,0,0.06)",
                                color:
                                  product.category.color ??
                                  "var(--color-foreground)",
                              }}
                            >
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-foreground/30">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-foreground/50">
                          {product.sku ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-foreground/60">
                          {product.unit}
                        </td>
                        <td className="px-6 py-4 text-foreground/60">
                          {fmt(product.buyingPrice)}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {fmt(product.sellingPrice)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${
                              low ? "text-amber-600" : "text-foreground"
                            }`}
                          >
                            {Number(product.stockQty).toFixed(2)}{" "}
                            <span className="text-xs font-normal text-foreground/40">
                              {product.unit}
                            </span>
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditTarget(product)}
                                className="p-1.5 rounded-lg hover:bg-foreground/8 text-foreground/40 hover:text-foreground transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(product)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
