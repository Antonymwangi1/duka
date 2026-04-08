import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { createProduct, getProducts } from "@/lib/inventory";
import { ProductSchema } from "@/lib/validation/product";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) throw new AppError("ShopId is required", 400);

    const data = await getProducts(userId, shopId);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, ...rest } = body;
    const validatedData = ProductSchema.parse(rest);

    const userId = getUserId(req);

    if (!shopId) throw new AppError("ShopId is required", 400);

    const data = await createProduct(shopId, userId, validatedData);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
