import { deleteCategory } from "@/lib/categories";
import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const { id: categoryId } = await params;

    if (!shopId) throw new AppError("ShopId is required", 400);
    if (!categoryId) throw new AppError("CategoryId is required", 400);

    await deleteCategory(shopId, userId, categoryId);

    return apiResponse({ message: "Category deleted successfully" });
  } catch (error: any) {
    return apiError(error);
  }
}
