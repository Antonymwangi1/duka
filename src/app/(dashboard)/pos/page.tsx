// src/app/(dashboard)/pos/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import instance from "@/lib/axios";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  X,
  Loader2,
  Receipt,
  Package,
  CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  sellingPrice: string;
  stockQty: string;
  lowStockThreshold: number | null;
  category: { name: string; color: string | null } | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SaleResponse {
  id: string;
  receiptNumber: string;
  total: string;
  subtotal: string;
  discount: string;
  change: string;
  amountPaid: string;
  paymentMethod: string;
  items: {
    quantity: string;
    sellingPrice: string;
    lineTotal: string;
    product: { name: string };
  }[];
  createdAt: string;
}

type PaymentMethod = "CASH" | "MPESA" | "CARD";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: string | number) =>
  `KES ${Number(n).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─── Receipt Modal ────────────────────────────────────────────────────────────

const ReceiptModal = ({
  sale,
  onClose,
}: {
  sale: SaleResponse;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="w-full max-w-sm bg-background rounded-2xl border border-foreground/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-5 text-center">
        <CheckCircle2 size={32} className="text-white mx-auto mb-2" />
        <h2 className="text-white font-bold text-lg">Sale Complete</h2>
        <p className="text-white/70 text-xs mt-1 font-mono">
          {sale.receiptNumber}
        </p>
      </div>

      {/* Items */}
      <div className="px-6 py-4 space-y-2 border-b border-foreground/8">
        {sale.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-foreground/70">
              {item.product.name}{" "}
              <span className="text-foreground/40">
                × {Number(item.quantity)}
              </span>
            </span>
            <span className="text-foreground font-medium">
              {fmt(item.lineTotal)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-6 py-4 space-y-2 border-b border-foreground/8 text-sm">
        <div className="flex justify-between text-foreground/60">
          <span>Subtotal</span>
          <span>{fmt(sale.subtotal)}</span>
        </div>
        {Number(sale.discount) > 0 && (
          <div className="flex justify-between text-foreground/60">
            <span>Discount</span>
            <span>- {fmt(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-foreground text-base">
          <span>Total</span>
          <span>{fmt(sale.total)}</span>
        </div>
        <div className="flex justify-between text-foreground/60">
          <span>Paid ({sale.paymentMethod})</span>
          <span>{fmt(sale.amountPaid)}</span>
        </div>
        {Number(sale.change) > 0 && (
          <div className="flex justify-between text-primary font-semibold">
            <span>Change</span>
            <span>{fmt(sale.change)}</span>
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          New Sale
        </button>
      </div>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function POSPage() {
  const { shopId, role } = useAuthStore();
  const canDiscount = role === "OWNER" || role === "MANAGER";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [mpesaRef, setMpesaRef] = useState("");
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SaleResponse | null>(null);

  // ── Fetch products ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!shopId) return;
    const fetch = async () => {
      try {
        const res = await instance.get(`/products?shopId=${shopId}`);
        setProducts(res.data.data.products ?? []);
      } catch {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [shopId]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.sku ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.product.sellingPrice) * item.quantity,
        0,
      ),
    [cart],
  );

  const total = Math.max(0, subtotal - (canDiscount ? discount : 0));
  const change = Math.max(0, amountPaid - total);
  const canCharge =
    cart.length > 0 &&
    amountPaid >= total &&
    (paymentMethod !== "MPESA" || mpesaRef.trim().length > 0);

  // ── Cart actions ────────────────────────────────────────────────────────────

  const addToCart = (product: Product) => {
    if (Number(product.stockQty) <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        // don't exceed stock
        if (existing.quantity >= Number(product.stockQty)) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const resetSale = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid(0);
    setMpesaRef("");
    setNote("");
    setPaymentMethod("CASH");
    setSaleError(null);
    setReceipt(null);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleCharge = async () => {
    if (!shopId || !canCharge) return;
    setSubmitting(true);
    setSaleError(null);

    try {
      const payload = {
        shopId,
        paymentMethod,
        mpesaRef: paymentMethod === "MPESA" ? mpesaRef : null,
        discount: canDiscount ? discount : 0,
        amountPaid,
        note: note || null,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      };

      const res = await instance.post("/sales", payload);
      setReceipt(res.data.data);
    } catch (err: any) {
      setSaleError(
        err.response?.data?.error || "Sale failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {receipt && <ReceiptModal sale={receipt} onClose={resetSale} />}

      <div className="flex gap-6 h-[calc(100vh-theme(spacing.16))] max-w-7xl mx-auto">
        {/* LEFT — Product Grid */}
        <div className="flex-1 flex flex-col min-w-0 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Point of Sale
            </h1>
            <p className="text-sm text-foreground/50 mt-0.5">
              Search or tap a product to add it to the cart
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-foreground/15 bg-background py-2.5 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl bg-foreground/8 h-24"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Package size={32} className="text-foreground/20" />
              <p className="text-sm text-foreground/40">No products found</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((product) => {
                  const outOfStock = Number(product.stockQty) <= 0;
                  const inCart = cart.find((i) => i.product.id === product.id);

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={outOfStock}
                      className={`relative rounded-xl border p-3 text-left transition-all ${
                        outOfStock
                          ? "border-foreground/8 bg-foreground/3 opacity-50 cursor-not-allowed"
                          : inCart
                            ? "border-primary bg-primary/8 shadow-sm"
                            : "border-foreground/10 bg-background hover:border-primary/50 hover:bg-primary/4"
                      }`}
                    >
                      {inCart && (
                        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                          {inCart.quantity}
                        </span>
                      )}
                      <p className="text-sm font-semibold text-foreground leading-tight pr-5">
                        {product.name}
                      </p>
                      <p className="text-xs text-primary font-bold mt-1">
                        {fmt(product.sellingPrice)}
                      </p>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        {Number(product.stockQty)} {product.unit} left
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Cart + Checkout */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          {/* Cart */}
          <div className="flex-1 rounded-2xl border border-foreground/10 bg-background overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/8">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-foreground/50" />
                <h2 className="text-sm font-semibold text-foreground">Cart</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-foreground/40 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6">
                <ShoppingCart size={28} className="text-foreground/15" />
                <p className="text-xs text-foreground/30 text-center">
                  Tap a product to add it here
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-foreground/6">
                {cart.map((item) => (
                  <div key={item.product.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-foreground leading-tight flex-1">
                        {item.product.name}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-foreground/30 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="h-6 w-6 rounded-lg border border-foreground/15 flex items-center justify-center text-foreground/60 hover:bg-foreground/8 transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-sm font-semibold text-foreground w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          disabled={
                            item.quantity >= Number(item.product.stockQty)
                          }
                          className="h-6 w-6 rounded-lg border border-foreground/15 flex items-center justify-center text-foreground/60 hover:bg-foreground/8 transition-colors disabled:opacity-30"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {fmt(Number(item.product.sellingPrice) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Panel */}
          <div className="rounded-2xl border border-foreground/10 bg-background p-4 space-y-4">
            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {canDiscount && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground/60 shrink-0">Discount</span>
                  <input
                    type="number"
                    min={0}
                    max={subtotal}
                    value={discount || ""}
                    onChange={(e) =>
                      setDiscount(Math.min(Number(e.target.value), subtotal))
                    }
                    placeholder="0"
                    className="w-24 text-right rounded-lg border border-foreground/15 bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary transition"
                  />
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground text-base pt-1 border-t border-foreground/8">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-1.5">
              {(["CASH", "MPESA", "CARD"] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                    paymentMethod === method
                      ? "bg-primary text-white"
                      : "border border-foreground/15 text-foreground/60 hover:border-primary/50"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* M-Pesa Ref */}
            {paymentMethod === "MPESA" && (
              <input
                value={mpesaRef}
                onChange={(e) => setMpesaRef(e.target.value)}
                placeholder="M-Pesa reference"
                className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            )}

            {/* Amount Paid */}
            <div className="space-y-1">
              <label className="text-xs text-foreground/50">Amount Paid</label>
              <input
                type="number"
                min={0}
                value={amountPaid || ""}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            {/* Change */}
            {amountPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-foreground/50">Change</span>
                <span
                  className={`font-semibold ${
                    change < 0 ? "text-red-500" : "text-primary"
                  }`}
                >
                  {change < 0
                    ? `Short by ${fmt(Math.abs(amountPaid - total))}`
                    : fmt(change)}
                </span>
              </div>
            )}

            {/* Note */}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add note (optional)"
              className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />

            {/* Error */}
            {saleError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {saleError}
              </p>
            )}

            {/* Charge Button */}
            <button
              onClick={handleCharge}
              disabled={!canCharge || submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Receipt size={16} />
                  Charge {cart.length > 0 ? fmt(total) : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
