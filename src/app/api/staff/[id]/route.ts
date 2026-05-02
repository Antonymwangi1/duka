import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { removeStaff } from "@/lib/staff";
import { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const { id: shopUserId } = await params;

    if (!shopId) throw new AppError("ShopId is required", 400);
    if (!shopUserId) throw new AppError("ShopUserId is required", 400);

    const data = await removeStaff(shopId, userId, shopUserId);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
