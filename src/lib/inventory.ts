import prisma from "./prisma";
import { AppError } from "./error";
import {
  ProductData,
  ProductSchema,
  UpdateProductData,
  UpdateProductSchema,
} from "./validation/product";

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

  return memberShip.role;
};

// get products
export const getProducts = async (userId: string, shopId: string) => {
  // verify if shop belongs to the user first
  await memberShipVerification(shopId, userId);

  const products = await prisma.product.findMany({
    where: {
      shopId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      buyingPrice: true,
      sellingPrice: true,
      stockQty: true,
      unit: true,
      category: true,
      isActive: true,
      lowStockThreshold: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return { products };
};

export const getProductById = async (
  userId: string,
  shopId: string,
  productId: string,
) => {
  await memberShipVerification(shopId, userId);

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      buyingPrice: true,
      sellingPrice: true,
      stockQty: true,
      unit: true,
      category: true,
      isActive: true,
    },
  });

  if(!product) {
    throw new AppError("Product not found", 404)
  }

  return { product };
};

// creating a product
export const createProduct = async (
  shopId: string,
  userId: string,
  data: ProductData,
) => {
  const role = await memberShipVerification(shopId, userId);

  // check the user role
  if (role === "CASHIER") {
    throw new AppError(
      "Unauthorized: You do not have the access to add products.",
      403,
    );
  }

  // validate data
  const validatedData = ProductSchema.parse(data);

  // check if sku is provided and check if product is in our database.
  if (validatedData.sku) {
    const existingSku = await prisma.product.findUnique({
      where: {
        shopId_sku: {
          shopId: shopId,
          sku: validatedData.sku,
        },
      },
    });

    if (existingSku) {
      return await prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
          where: { id: existingSku.id },
          data: {
            stockQty: { increment: validatedData.stockQty },
            buyingPrice: validatedData.buyingPrice,
            sellingPrice: validatedData.sellingPrice,
          },
          select: {
            id: true,
            name: true,
            sku: true,
            buyingPrice: true,
            sellingPrice: true,
            stockQty: true,
            unit: true,
            category: true,
            isActive: true,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: updatedProduct.id,
            shopId: shopId,
            userId: userId,
            quantityChange: validatedData.stockQty,
            reason: "RESTOCK",
            note: "Product details updated",
          },
        });

        return updatedProduct;
      });
    }
  }

  // save to db
  return await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        ...validatedData,
        shopId: shopId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        buyingPrice: true,
        sellingPrice: true,
        stockQty: true,
        unit: true,
        category: true,
        isActive: true,
      },
    });

    await tx.stockMovement.create({
      data: {
        productId: newProduct.id,
        shopId: shopId,
        userId: userId,
        quantityChange: validatedData.stockQty,
        reason: "OPENING_STOCK",
        note: "Initial product creation",
      },
    });

    return newProduct;
  });
};

// updating a product
export const updateProduct = async (
  shopId: string,
  userId: string,
  productId: string,
  data: UpdateProductData,
) => {
  const role = await memberShipVerification(shopId, userId);

  // check the user role
  if (role === "CASHIER") {
    throw new AppError(
      "Unauthorized: You do not have the access to add products.",
      403,
    );
  }

  const validateUpdateData = UpdateProductSchema.parse(data);

  // check if the productId in db
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: productId, shopId: shopId },
      data: {
        ...validateUpdateData,
        shopId: shopId,
      },
      select: {
        id: true,
        name: true,
        buyingPrice: true,
        sku: true,
        sellingPrice: true,
        stockQty: true,
        unit: true,
        category: true,
        isActive: true,
      },
    });

    if (validateUpdateData.stockQty !== undefined) {
      await tx.stockMovement.create({
        data: {
          productId: updatedProduct.id,
          shopId: shopId,
          userId: userId,
          quantityChange: validateUpdateData.stockQty,
          reason: "ADJUSTMENT",
          note: "Product details updated",
        },
      });
    }

    return updatedProduct;
  });
};

// deleting a product
export const deleteProduct = async (
  shopId: string,
  userId: string,
  productId: string,
) => {
  const role = await memberShipVerification(shopId, userId);

  // check the user role
  if (role === "CASHIER") {
    throw new AppError(
      "Unauthorized: You do not have the access to add products.",
      403,
    );
  }

  // check if the productId in db
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // soft delete product
  const deletedProduct = await prisma.product.update({
    where: { id: productId, shopId: shopId },
    data: {
      isActive: false,
    },
  });

  return { message: "Product deleted successfully" };
};
