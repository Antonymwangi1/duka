import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { getReport } from "@/lib/reports";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = getUserId(request);

    const shopId = searchParams.get("shopId");
    if (!shopId) throw new AppError("ShopId is required", 400);

    const periodType = searchParams.get("periodType") as
      | "daily"
      | "weekly"
      | "monthly";

    const validPeriods = ["daily", "weekly", "monthly"];
    if (!validPeriods.includes(periodType!)) {
      throw new AppError(
        "Invalid period type. Must be daily, weekly or monthly",
        400,
      );
    }

    const date = searchParams.get("date");
    if (!date) throw new AppError("Date is required", 400);

    const reportData = await getReport(shopId, userId, periodType, date);
    return apiResponse(reportData);
  } catch (error: any) {
    return apiError(error);
  }
}
