import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { adjustStock } from "@/lib/stockAdjustment";
import { NextRequest } from "next/server";
import { z } from "zod";

const AdjustmentSchema = z.object({
  productId: z.string().min(1),
  reason: z.enum(["ADJUSTMENT", "DAMAGE", "RETURN"]),
  quantity: z.number().nonnegative(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const { shopId, ...rest } = body;

    if (!shopId) throw new AppError("ShopId is required", 400);

    const validatedData = AdjustmentSchema.parse(rest);
    const data = await adjustStock(shopId, userId, validatedData);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
