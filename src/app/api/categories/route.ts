import { createCategory, getCategories } from "@/lib/categories";
import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { categorySchema } from "@/lib/validation/category";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // shopId
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) throw new AppError("ShopId is required", 400);

    const userId = getUserId(req);

    const data = await getCategories(shopId, userId);

    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const { shopId, ...rest } = body;

    if (!shopId) throw new AppError("ShopId is required", 400);

    const validatedData = categorySchema.parse(rest);

    const data = await createCategory(shopId, userId, validatedData);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
