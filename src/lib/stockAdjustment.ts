import { Decimal } from "@prisma/client/runtime/client";
import { AppError } from "./error";
import prisma from "./prisma";

const membershipCheck = async (shopId: string, userId: string) => {
  const membership = await prisma.shopUser.findUnique({
    where: { shopId_userId: { shopId, userId } },
  });
  if (!membership) {
    throw new AppError(
      "Unauthorized: You do not have access to this shop.",
      403,
    );
  }
  if (membership.role === "CASHIER") {
    throw new AppError("Unauthorized: Cashiers cannot adjust stock.", 403);
  }
  return membership;
};

export const adjustStock = async (
  shopId: string,
  userId: string,
  data: {
    productId: string;
    reason: "ADJUSTMENT" | "DAMAGE" | "RETURN";
    quantity: number; // absolute for ADJUSTMENT, delta for DAMAGE/RETURN
    note?: string;
  },
) => {
  await membershipCheck(shopId, userId);

  const product = await prisma.product.findUnique({
    where: { id: data.productId, shopId, isActive: true },
  });
  if (!product) throw new AppError("Product not found.", 404);

  let quantityChange: Decimal;
  let newStockQty: Decimal;

  if (data.reason === "ADJUSTMENT") {
    // Absolute — new total stock qty
    if (data.quantity < 0) {
      throw new AppError("New stock quantity cannot be negative.", 400);
    }
    newStockQty = new Decimal(data.quantity);
    quantityChange = newStockQty.minus(product.stockQty);
  } else {
    // Delta — how many damaged or returned (always positive input)
    if (data.quantity <= 0) {
      throw new AppError("Quantity must be greater than zero.", 400);
    }
    if (data.reason === "DAMAGE") {
      if (new Decimal(data.quantity).greaterThan(product.stockQty)) {
        throw new AppError(
          `Cannot damage more than current stock (${product.stockQty} ${product.unit}).`,
          400,
        );
      }
      quantityChange = new Decimal(data.quantity).negated();
      newStockQty = product.stockQty.minus(data.quantity);
    } else {
      // RETURN — stock comes back in
      quantityChange = new Decimal(data.quantity);
      newStockQty = product.stockQty.plus(data.quantity);
    }
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: data.productId },
      data: { stockQty: newStockQty },
      select: {
        id: true,
        name: true,
        stockQty: true,
        unit: true,
      },
    });

    await tx.stockMovement.create({
      data: {
        shopId,
        productId: data.productId,
        userId,
        quantityChange,
        reason: data.reason,
        note: data.note || null,
      },
    });

    return { product: updated };
  });
};
