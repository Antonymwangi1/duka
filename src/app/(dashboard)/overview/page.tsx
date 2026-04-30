// src/app/(dashboard)/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import instance from "@/lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Sale {
  id: string;
  receiptNumber: string;
  total: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: { product: { name: string }; quantity: string; lineTotal: string }[];
}

interface Product {
  id: string;
  name: string;
  stockQty: string;
  lowStockThreshold: number | null;
  unit: string;
  category: { name: string; color: string | null } | null;
}

interface TopProduct {
  name: string;
  quantity: number;
}

interface Report {
  totalRevenue: string;
  totalSales: string;
  grossProfit: string;
  totalTransactions: number;
  topProductsJson: TopProduct[] | null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-foreground/8 ${className}`} />
);

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  accent?: boolean;
}

const MetricCard = ({
  label,
  value,
  sub,
  icon,
  trend,
  accent,
}: MetricCardProps) => (
  <div
    className={`relative rounded-2xl p-5 flex flex-col gap-3 border transition-all ${
      accent
        ? "bg-primary text-white border-primary"
        : "bg-background border-foreground/10 text-foreground"
    }`}
  >
    <div className="flex items-center justify-between">
      <span
        className={`text-xs font-semibold uppercase tracking-widest ${accent ? "text-white/70" : "text-foreground/50"}`}
      >
        {label}
      </span>
      <div
        className={`p-2 rounded-xl ${accent ? "bg-white/15" : "bg-foreground/6"}`}
      >
        {icon}
      </div>
    </div>
    <div>
      <p
        className={`text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-foreground"}`}
      >
        {value}
      </p>
      {sub && (
        <p
          className={`text-xs mt-1 flex items-center gap-1 ${accent ? "text-white/60" : "text-foreground/50"}`}
        >
          {trend === "up" && (
            <ArrowUpRight size={12} className="text-emerald-400" />
          )}
          {trend === "down" && (
            <ArrowDownRight size={12} className="text-red-400" />
          )}
          {sub}
        </p>
      )}
    </div>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: string | number) =>
  `KES ${Number(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LOW_STOCK_FALLBACK = 5;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { shopId } = useAuthStore();

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{
    sales?: string;
    products?: string;
    report?: string;
  }>({});

  useEffect(() => {
    if (!shopId) return;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const fetchAll = async () => {
      setLoading(true);

      const [salesRes, productsRes, reportRes] = await Promise.allSettled([
        instance.get(
          `/sales?shopId=${shopId}&startDate=${startOfDay}&endDate=${endOfDay}`,
        ),
        instance.get(`/products?shopId=${shopId}`),
        instance.get(`/reports?shopId=${shopId}&periodType=weekly&date=${format(new Date(), "yyyy-MM-dd")}`),
      ]);

      const errs: typeof errors = {};

      if (salesRes.status === "fulfilled") {
        setSales(salesRes.value.data.data ?? []);
      } else {
        errs.sales = "Could not load sales.";
      }

      if (productsRes.status === "fulfilled") {
        setProducts(productsRes.value.data.data.products ?? []);
      } else {
        errs.products = "Could not load products.";
      }

      if (reportRes.status === "fulfilled") {
        const raw = reportRes.value.data.data;
        if (raw && typeof raw.topProductsJson === "string") {
          try {
            raw.topProductsJson = JSON.parse(raw.topProductsJson);
          } catch {
            raw.topProductsJson = [];
          }
        }
        setReport(raw ?? null);
      }

      setErrors(errs);
      setLoading(false);
    };

    fetchAll();
  }, [shopId]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const todayRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const todaySalesCount = sales.length;
  const lowStockProducts = products.filter(
    (p) => Number(p.stockQty) <= (p.lowStockThreshold ?? LOW_STOCK_FALLBACK),
  );
  const recentSales = sales.slice(0, 5);
  const topProducts: TopProduct[] = report?.topProductsJson ?? [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-foreground/50 mt-0.5">
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      {/* Metric Cards */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Today's Revenue"
              value={fmt(todayRevenue)}
              sub={`${todaySalesCount} transaction${todaySalesCount !== 1 ? "s" : ""}`}
              icon={<TrendingUp size={16} className="text-white" />}
              accent
            />
            <MetricCard
              label="Today's Sales"
              value={String(todaySalesCount)}
              sub="completed sales"
              icon={<ShoppingCart size={16} className="text-foreground/60" />}
            />
            <MetricCard
              label="Weekly Profit"
              value={report ? fmt(report.grossProfit) : "—"}
              sub={
                report
                  ? `from ${report.totalTransactions} transactions`
                  : "no report yet"
              }
              icon={<Receipt size={16} className="text-foreground/60" />}
              trend={report && Number(report.grossProfit) > 0 ? "up" : "down"}
            />
            <MetricCard
              label="Low Stock"
              value={String(lowStockProducts.length)}
              sub={
                lowStockProducts.length > 0
                  ? "items need restocking"
                  : "all stock levels OK"
              }
              icon={
                <AlertTriangle
                  size={16}
                  className={
                    lowStockProducts.length > 0
                      ? "text-amber-500"
                      : "text-foreground/60"
                  }
                />
              }
              trend={lowStockProducts.length > 0 ? "down" : "neutral"}
            />
          </div>
        )}
      </section>

      {/* Main grid — Recent Sales + Top Products */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales — 2/3 width */}
        <div className="lg:col-span-2 rounded-2xl border border-foreground/10 bg-background overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/8">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Sales
            </h2>
            <span className="text-xs text-foreground/40">Today</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : errors.sales ? (
            <p className="p-6 text-sm text-red-500">{errors.sales}</p>
          ) : recentSales.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart
                size={32}
                className="mx-auto text-foreground/20 mb-3"
              />
              <p className="text-sm text-foreground/40">
                No sales recorded today
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-foreground/40 uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Receipt</th>
                    <th className="px-6 py-3 font-medium">Items</th>
                    <th className="px-6 py-3 font-medium">Payment</th>
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/6">
                  {recentSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-foreground/3 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono text-xs text-foreground/70">
                        {sale.receiptNumber}
                      </td>
                      <td className="px-6 py-3.5 text-foreground/60">
                        {sale.items.map((i) => i.product.name).join(", ")}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            sale.paymentMethod === "MPESA"
                              ? "bg-primary/10 text-primary"
                              : "bg-foreground/8 text-foreground/60"
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-foreground/50 text-xs">
                        {format(new Date(sale.createdAt), "HH:mm")}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-foreground">
                        {fmt(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products Chart — 1/3 width */}
        <div className="rounded-2xl border border-foreground/10 bg-background overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/8">
            <h2 className="text-sm font-semibold text-foreground">
              Top Products
            </h2>
            <span className="text-xs text-foreground/40">This week</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : errors.report ? (
            <p className="p-6 text-sm text-red-500">{errors.report}</p>
          ) : topProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={32} className="mx-auto text-foreground/20 mb-3" />
              <p className="text-sm text-foreground/40">
                No data yet this week
              </p>
            </div>
          ) : (
            <div className="p-4 pt-6">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-foreground)",
                      opacity: 0.5,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-foreground)", opacity: 0.04 }}
                    contentStyle={{
                      background: "var(--color-background)",
                      border:
                        "1px solid color-mix(in srgb, var(--color-foreground) 10%, transparent)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "var(--color-foreground)",
                    }}
                    formatter={(val) => {
                      const num =
                        typeof val === "number" ? val : Number(val ?? 0);
                      return [`${num} units`, "Qty Sold"];
                    }}
                  />
                  <Bar dataKey="quantity" radius={[0, 6, 6, 0]} maxBarSize={16}>
                    {topProducts.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === 0
                            ? "#1D9E75"
                            : `rgba(29,158,117,${0.7 - i * 0.12})`
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Low Stock Alerts */}
      {!loading && lowStockProducts.length > 0 && (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-500/10">
            <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            <h2 className="text-sm font-semibold text-foreground">
              Low Stock Alerts
            </h2>
            <span className="ml-auto text-xs text-foreground/40">
              {lowStockProducts.length} item
              {lowStockProducts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-amber-500/10">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {p.name}
                  </p>
                  {p.category && (
                    <p className="text-xs text-foreground/40">
                      {p.category.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-600">
                    {Number(p.stockQty).toFixed(1)} {p.unit}
                  </p>
                  <p className="text-xs text-foreground/40">
                    threshold: {p.lowStockThreshold ?? LOW_STOCK_FALLBACK}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
