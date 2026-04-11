import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { getSaleById } from "@/lib/sales";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const { id: saleId } = await params;

    if (!shopId) throw new AppError("ShopId is required", 400);
    if (!saleId) throw new AppError("SaleId is required", 400);

    const sale = await getSaleById(userId, shopId, saleId);
    return apiResponse(sale);
  } catch (error: any) {
    console.error("Error fetching sale:", error);
    return apiError(error);
  }
}
