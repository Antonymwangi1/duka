import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { getShop, updateShop } from "@/lib/shop";
import { NextRequest } from "next/server";
import { z } from "zod";

const UpdateShopSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  defaultLowStockThreshold: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    if (!shopId) throw new AppError("ShopId is required", 400);

    const data = await getShop(shopId, userId);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const { shopId, ...rest } = body;
    if (!shopId) throw new AppError("ShopId is required", 400);

    const validatedData = UpdateShopSchema.parse(rest);
    const data = await updateShop(shopId, userId, validatedData);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
