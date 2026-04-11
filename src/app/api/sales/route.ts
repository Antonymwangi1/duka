import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { createSale, getSales } from "@/lib/sales";
import { SaleSchema } from "@/lib/validation/sale";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, ...saleData } = body;
    const validatedData = SaleSchema.parse(saleData);

    const userId = getUserId(req);

    if (!shopId) throw new AppError("ShopId is required", 400);

    const sale = await createSale(userId, shopId, validatedData);

    return apiResponse(sale, 201);
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    if (!shopId) throw new AppError("ShopId is required", 400);

    const sales = await getSales(userId, shopId, startDate, endDate);
    return apiResponse(sales);
  } catch (error: any) {
    console.error("Error fetching sales:", error);
    return apiError(error);
  }
}
