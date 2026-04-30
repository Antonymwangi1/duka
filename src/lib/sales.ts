import { Decimal } from "@prisma/client/runtime/client";
import { AppError } from "./error";
import prisma from "./prisma";
import { SaleData } from "./validation/sale";

const memberShipVerification = async (shopId: string, userId: string) => {
  const memberShip = await prisma.shopUser.findUnique({
    where: {
      shopId_userId: {
        shopId,
        userId,
      },
    },
  });

  if (!memberShip) {
    throw new AppError(
      "Unauthorized: You do not have access to this shop.",
      403,
    );
  }
};

const generateReceiptNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `DK-${dateStr}-${random}`;
};

export const createSale = async (
  userId: string,
  shopId: string,
  data: SaleData,
) => {
  await memberShipVerification(shopId, userId);

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      shopId: shopId,
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError("One or more products were not found in your shop", 404);
  }

  let calculatedSubtotal = new Decimal(0);

  const preparedItems = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;

    if (product.stockQty.lessThan(item.quantity)) {
      throw new AppError(`Insufficient stock for ${product.name}.`, 400);
    }

    const lineTotal = new Decimal(item.quantity).mul(product.sellingPrice);
    calculatedSubtotal = calculatedSubtotal.add(lineTotal);

    return {
      productId: product.id,
      quantity: item.quantity,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      lineTotal: lineTotal,
    };
  });

  const total = calculatedSubtotal.minus(data.discount || 0);
  const change = new Decimal(data.amountPaid).minus(total);
  const receiptNumber = generateReceiptNumber();

  const sale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        shopId,
        userId,
        receiptNumber,
        status: "COMPLETED",
        paymentMethod: data.paymentMethod,
        mpesaRef: data.mpesaRef,
        subtotal: calculatedSubtotal,
        discount: data.discount || 0,
        total: total,
        amountPaid: data.amountPaid,
        change: change,
        items: {
          create: preparedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            buyingPrice: item.buyingPrice,
            sellingPrice: item.sellingPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    await Promise.all(
      preparedItems.map(async (item) => {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: { decrement: item.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            shopId,
            productId: item.productId,
            userId,
            saleId: sale.id,
            quantityChange: new Decimal(item.quantity).negated(),
            reason: "SALE",
            note: `Sale #${receiptNumber}`,
          },
        });
      }),
    );

    return sale;
  });

  // Invalidate report cache so next dashboard load recalculates with new sale
  await prisma.report.deleteMany({
    where: { shopId },
  });

  return sale;
};

export const getSales = async (
  userId: string,
  shopId: string,
  startDate?: string,
  endDate?: string,
) => {
  await memberShipVerification(shopId, userId);

  return await prisma.sale.findMany({
    where: {
      shopId,
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: { items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
};

export const getSaleById = async (
  userId: string,
  shopId: string,
  saleId: string,
) => {
  await memberShipVerification(shopId, userId);

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, shopId },
    include: { items: { include: { product: { select: { name: true } } } } },
  });

  if (!sale) {
    throw new AppError("Sale not found", 404);
  }

  return sale;
};
