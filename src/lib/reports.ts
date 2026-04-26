import { AppError } from "./error";
import prisma from "./prisma";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
} from "date-fns";

export const getReport = async (
  shopId: string,
  userId: string,
  periodType: "daily" | "weekly" | "monthly",
  date: string,
) => {
  // 1. Authorization Check
  const memberShipValidation = await prisma.shopUser.findUnique({
    where: { shopId_userId: { shopId, userId } },
  });

  if (!memberShipValidation) {
    throw new AppError(
      "Unauthorized: You do not have access to this shop.",
      403,
    );
  }

  const targetDate = parseISO(date);
  if (isNaN(targetDate.getTime()))
    throw new AppError("Invalid date format.", 400);

  // 2. Generate Period Key and Date Range
  let startDate: Date;
  let endDate: Date;
  let periodKey: string;

  switch (periodType) {
    case "daily":
      startDate = startOfDay(targetDate);
      endDate = endOfDay(targetDate);
      periodKey = format(targetDate, "yyyy-MM-dd");
      break;
    case "weekly":
      startDate = startOfWeek(targetDate, { weekStartsOn: 1 });
      endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
      periodKey = format(targetDate, "RRRR-'W'II"); // e.g., 2026-W15
      break;
    case "monthly":
      startDate = startOfMonth(targetDate);
      endDate = endOfMonth(targetDate);
      periodKey = format(targetDate, "yyyy-MM");
      break;
    default:
      throw new AppError("Invalid period type.", 400);
  }

  // 3. Cache Lookup
  const cachedReport = await prisma.report.findUnique({
    where: {
      shopId_period_periodType: {
        shopId,
        period: periodKey,
        periodType: periodType,
      },
    },
  });

  if (cachedReport) return cachedReport;

  // 4. Calculations (Aggregate & Raw Query)
  const [salesAgg, cogsResult] = await Promise.all([
    prisma.sale.aggregate({
      where: { shopId, createdAt: { gte: startDate, lte: endDate } },
      _sum: { total: true, discount: true },
      _count: { id: true },
    }),
    prisma.$queryRaw<{ total: number | null }[]>`
      SELECT SUM(si."buyingPrice" * si.quantity) as total
      FROM "SaleItem" si
      JOIN "Sale" s ON si."saleId" = s.id
      WHERE s."shopId" = ${shopId}
      AND s."createdAt" >= ${startDate}
      AND s."createdAt" <= ${endDate}
    `,
  ]);

  const totalRevenue = Number(salesAgg._sum.total || 0);
  const totalCOGS = Number(cogsResult[0]?.total || 0);
  const totalDiscount = Number(salesAgg._sum.discount || 0);
  const totalTransactions = salesAgg._count.id;

  // 5. Optimized Top Products Fetch
  const topProductsRaw = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: { shopId, createdAt: { gte: startDate, lte: endDate } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const productIds = topProductsRaw.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const topProductsJson = topProductsRaw.map((item) => ({
    name: products.find((p) => p.id === item.productId)?.name || "Unknown",
    quantity: item._sum.quantity || 0,
  }));

  // 6. Save and Return Result
  return await prisma.report.create({
    data: {
      shopId,
      period: periodKey,
      periodType: periodType,
      totalRevenue,
      totalCOGS,
      totalSales: totalRevenue, // Assuming totalSales is equivalent to totalRevenue
      grossProfit: totalRevenue - totalCOGS,
      totalDiscount,
      totalTransactions,
      topProductsJson: topProductsJson,
    },
  });
};
