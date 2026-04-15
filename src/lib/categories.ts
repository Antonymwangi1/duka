import { AppError } from "./error";
import prisma from "./prisma";
import { CategoryData, categorySchema } from "./validation/category";

const membershipValidation = async (shopId: string, userId: string) => {
  const membership = await prisma.shopUser.findUnique({
    where: {
      shopId_userId: {
        shopId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError("User is not a member of the shop", 403);
  }
};

export const getCategories = async (shopId: string, userId: string) => {
  await membershipValidation(shopId, userId);

  const categories = await prisma.category.findMany({
    where: {
      shopId,
    },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });
  return { categories };
};

export const createCategory = async (
  shopId: string,
  userId: string,
  data: CategoryData,
) => {
  await membershipValidation(shopId, userId);

  const validateCategory = categorySchema.parse(data);

  const category = await prisma.category.create({
    data: {
      name: validateCategory.name,
      color: validateCategory.color,
      shopId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return { category };
};

export const deleteCategory = async (
  shopId: string,
  userId: string,
  categoryId: string,
) => {
  await membershipValidation(shopId, userId);

  //   check if category exists and belongs to the shop
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category || category.shopId !== shopId) {
    throw new AppError("Category not found", 404);
  }

  await prisma.category.delete({
    where: {
      id: categoryId,
      shopId,
    },
  });
};
