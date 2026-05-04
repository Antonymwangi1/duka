import { AppError } from "./error";
import prisma from "./prisma";

const ownerCheck = async (shopId: string, userId: string) => {
  const membership = await prisma.shopUser.findUnique({
    where: { shopId_userId: { shopId, userId } },
  });
  if (!membership) {
    throw new AppError("Unauthorized: You do not have access to this shop.", 403);
  }
  if (membership.role !== "OWNER") {
    throw new AppError("Unauthorized: Only owners can update shop settings.", 403);
  }
};

export const getShop = async (shopId: string, userId: string) => {
  const membership = await prisma.shopUser.findUnique({
    where: { shopId_userId: { shopId, userId } },
  });
  if (!membership) {
    throw new AppError("Unauthorized: You do not have access to this shop.", 403);
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      location: true,
      phone: true,
      currency: true,
      plan: true,
      defaultLowStockThreshold: true,
    },
  });

  if (!shop) throw new AppError("Shop not found.", 404);
  return { shop };
};

export const updateShop = async (
  shopId: string,
  userId: string,
  data: {
    name?: string;
    location?: string;
    phone?: string;
    defaultLowStockThreshold?: number;
  },
) => {
  await ownerCheck(shopId, userId);

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data,
    select: {
      id: true,
      name: true,
      location: true,
      phone: true,
      currency: true,
      plan: true,
      defaultLowStockThreshold: true,
    },
  });

  return { shop };
};