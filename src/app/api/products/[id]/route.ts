import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { deleteProduct, getProductById, updateProduct } from "@/lib/inventory";
import { UpdateProductSchema } from "@/lib/validation/product";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(req);
    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) throw new AppError("ShopId is required", 400);

    const data = await getProductById(userId, shopId, productId);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(req);
    const { id: productId } = await params;
    const body = await req.json();
    const { shopId, ...rest } = body;

    if (!shopId) throw new AppError("ShopId is required", 400);

    const data = await updateProduct(shopId, userId, productId, rest);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(req);
    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) throw new AppError("ShopId is required", 400);

    const data = await deleteProduct(shopId, userId, productId);

    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
