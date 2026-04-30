// src/app/(dashboard)/reports/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
  Receipt,
  ShoppingCart,
  TrendingDown,
  Tag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import {
  format,
  parseISO,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  startOfMonth,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodType = "daily" | "weekly" | "monthly";

interface TopProduct {
  name: string;
  quantity: number;
}

interface Report {
  totalRevenue: string;
  totalSales: string;
  grossProfit: string;
  totalCOGS: string;
  totalDiscount: string;
  totalTransactions: number;
  topProductsJson: TopProduct[] | null;
}

interface SaleItem {
  product: { name: string };
  quantity: string;
  lineTotal: string;
}

interface Sale {
  id: string;
  receiptNumber: string;
  total: string;
  subtotal: string;
  discount: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: SaleItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: string | number) =>
  `KES ${Number(n).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-foreground/8 ${className}`} />
);

const getPeriodLabel = (date: Date, periodType: PeriodType) => {
  switch (periodType) {
    case "daily":
      return format(date, "EEEE, d MMMM yyyy");
    case "weekly": {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
    }
    case "monthly":
      return format(date, "MMMM yyyy");
  }
};

const navigateDate = (date: Date, periodType: PeriodType, dir: 1 | -1) => {
  switch (periodType) {
    case "daily":
      return dir === 1 ? addDays(date, 1) : subDays(date, 1);
    case "weekly":
      return dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
    case "monthly":
      return dir === 1 ? addMonths(date, 1) : subMonths(date, 1);
  }
};

const getDateParam = (date: Date, periodType: PeriodType) => {
  switch (periodType) {
    case "daily":
      return format(date, "yyyy-MM-dd");
    case "weekly":
      return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    case "monthly":
      return format(startOfMonth(date), "yyyy-MM-dd");
  }
};

const getSalesDateRange = (date: Date, periodType: PeriodType) => {
  switch (periodType) {
    case "daily":
      return {
        startDate: format(date, "yyyy-MM-dd") + "T00:00:00.000Z",
        endDate: format(date, "yyyy-MM-dd") + "T23:59:59.999Z",
      };
    case "weekly": {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      return {
        startDate: format(start, "yyyy-MM-dd") + "T00:00:00.000Z",
        endDate: format(end, "yyyy-MM-dd") + "T23:59:59.999Z",
      };
    }
    case "monthly": {
      const start = startOfMonth(date);
      const end = addDays(addMonths(start, 1), -1);
      return {
        startDate: format(start, "yyyy-MM-dd") + "T00:00:00.000Z",
        endDate: format(end, "yyyy-MM-dd") + "T23:59:59.999Z",
      };
    }
  }
};

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  negative?: boolean;
}

const MetricCard = ({
  label,
  value,
  icon,
  accent,
  negative,
}: MetricCardProps) => (
  <div
    className={`rounded-2xl p-5 flex flex-col gap-3 border transition-all ${
      accent
        ? "bg-primary text-white border-primary"
        : "bg-background border-foreground/10"
    }`}
  >
    <div className="flex items-center justify-between">
      <span
        className={`text-xs font-semibold uppercase tracking-widest ${
          accent ? "text-white/70" : "text-foreground/50"
        }`}
      >
        {label}
      </span>
      <div
        className={`p-2 rounded-xl ${
          accent ? "bg-white/15" : "bg-foreground/6"
        }`}
      >
        {icon}
      </div>
    </div>
    <p
      className={`text-2xl font-bold tracking-tight ${
        accent ? "text-white" : negative ? "text-red-500" : "text-foreground"
      }`}
    >
      {value}
    </p>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { shopId } = useAuthStore();

  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [activeDate, setActiveDate] = useState(new Date());

  const [report, setReport] = useState<Report | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [salesError, setSalesError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!shopId) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const dateParam = getDateParam(activeDate, periodType);
      const res = await instance.get(
        `/reports?shopId=${shopId}&periodType=${periodType}&date=${dateParam}`,
      );
      const raw = res.data.data;
      if (raw && typeof raw.topProductsJson === "string") {
        try {
          raw.topProductsJson = JSON.parse(raw.topProductsJson);
        } catch {
          raw.topProductsJson = [];
        }
      }
      setReport(raw ?? null);
    } catch {
      setReportError("Could not load report for this period.");
    } finally {
      setReportLoading(false);
    }
  }, [shopId, periodType, activeDate]);

  const fetchSales = useCallback(async () => {
    if (!shopId) return;
    setSalesLoading(true);
    setSalesError(null);
    try {
      const { startDate, endDate } = getSalesDateRange(activeDate, periodType);
      const res = await instance.get(
        `/sales?shopId=${shopId}&startDate=${startDate}&endDate=${endDate}`,
      );
      setSales(res.data.data ?? []);
    } catch {
      setSalesError("Could not load sales for this period.");
    } finally {
      setSalesLoading(false);
    }
  }, [shopId, periodType, activeDate]);

  useEffect(() => {
    fetchReport();
    fetchSales();
  }, [fetchReport, fetchSales]);

  const topProducts: TopProduct[] = report?.topProductsJson ?? [];

  const navigate = (dir: 1 | -1) => {
    setActiveDate((prev) => navigateDate(prev, periodType, dir));
  };

  const isToday =
    format(activeDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const isCurrentPeriod = (() => {
    const now = new Date();
    switch (periodType) {
      case "daily":
        return isToday;
      case "weekly":
        return (
          format(startOfWeek(activeDate, { weekStartsOn: 1 }), "yyyy-MM-dd") ===
          format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
        );
      case "monthly":
        return format(activeDate, "yyyy-MM") === format(now, "yyyy-MM");
    }
  })();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Reports
          </h1>
          <p className="text-sm text-foreground/50 mt-0.5">
            {getPeriodLabel(activeDate, periodType)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Period Type Selector */}
          <div className="flex rounded-xl border border-foreground/15 overflow-hidden">
            {(["daily", "weekly", "monthly"] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriodType(p);
                  setActiveDate(new Date());
                }}
                className={`px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                  periodType === p
                    ? "bg-primary text-white"
                    : "text-foreground/60 hover:bg-foreground/5"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl border border-foreground/15 text-foreground/60 hover:bg-foreground/5 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setActiveDate(new Date())}
              disabled={isCurrentPeriod}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-foreground/15 text-xs font-medium text-foreground/60 hover:bg-foreground/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Calendar size={13} />
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={isCurrentPeriod}
              className="p-2 rounded-xl border border-foreground/15 text-foreground/60 hover:bg-foreground/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      {reportLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : reportError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
          <p className="text-sm text-red-500">{reportError}</p>
        </div>
      ) : report ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Revenue"
            value={fmt(report.totalRevenue)}
            icon={<TrendingUp size={16} className="text-white" />}
            accent
          />
          <MetricCard
            label="Gross Profit"
            value={fmt(report.grossProfit)}
            icon={
              <TrendingUp
                size={16}
                className={
                  Number(report.grossProfit) >= 0
                    ? "text-foreground/60"
                    : "text-red-500"
                }
              />
            }
            negative={Number(report.grossProfit) < 0}
          />
          <MetricCard
            label="COGS"
            value={fmt(report.totalCOGS)}
            icon={<TrendingDown size={16} className="text-foreground/60" />}
          />
          <MetricCard
            label="Transactions"
            value={String(report.totalTransactions)}
            icon={<ShoppingCart size={16} className="text-foreground/60" />}
          />
          <MetricCard
            label="Discounts"
            value={fmt(report.totalDiscount)}
            icon={<Tag size={16} className="text-foreground/60" />}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-foreground/10 bg-background px-6 py-12 text-center">
          <p className="text-sm text-foreground/40">
            No report data for this period yet.
          </p>
        </div>
      )}

      {/* Bottom Grid — Top Products + Sales Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="rounded-2xl border border-foreground/10 bg-background overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/8">
            <h2 className="text-sm font-semibold text-foreground">
              Top Products
            </h2>
            <span className="text-xs text-foreground/40 capitalize">
              {periodType}
            </span>
          </div>

          {reportLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={28} className="mx-auto text-foreground/20 mb-3" />
              <p className="text-sm text-foreground/40">No data yet</p>
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
                    cursor={{
                      fill: "var(--color-foreground)",
                      opacity: 0.04,
                    }}
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

        {/* Sales Table */}
        <div className="lg:col-span-2 rounded-2xl border border-foreground/10 bg-background overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/8">
            <h2 className="text-sm font-semibold text-foreground">Sales</h2>
            <span className="text-xs text-foreground/40">
              {sales.length} transaction{sales.length !== 1 ? "s" : ""}
            </span>
          </div>

          {salesLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : salesError ? (
            <p className="p-6 text-sm text-red-500">{salesError}</p>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt size={28} className="mx-auto text-foreground/20 mb-3" />
              <p className="text-sm text-foreground/40">
                No sales in this period
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-foreground/40 uppercase tracking-wider border-b border-foreground/8">
                    <th className="px-6 py-3 font-medium">Receipt</th>
                    <th className="px-6 py-3 font-medium">Items</th>
                    <th className="px-6 py-3 font-medium">Payment</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/6">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-foreground/3 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono text-xs text-foreground/70">
                        {sale.receiptNumber}
                      </td>
                      <td className="px-6 py-3.5 text-foreground/60 max-w-[180px] truncate">
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
                        {format(parseISO(sale.createdAt), "d MMM, HH:mm")}
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
      </div>
    </div>
  );
}
