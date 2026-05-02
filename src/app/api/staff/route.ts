import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { createStaff, getStaff } from "@/lib/staff";
import { CreateStaffSchema } from "@/lib/validation/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    if (!shopId) throw new AppError("ShopId is required", 400);

    const data = await getStaff(shopId, userId);
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

    const validatedData = CreateStaffSchema.parse(rest);
    const data = await createStaff(shopId, userId, validatedData);
    return apiResponse(data, 201);
  } catch (error: any) {
    return apiError(error);
  }
}
