import bcrypt from "bcryptjs";
import { AppError } from "./error";
import prisma from "./prisma";
import { CreateStaffData } from "./validation/auth";

const ownerCheck = async (shopId: string, userId: string) => {
  const membership = await prisma.shopUser.findUnique({
    where: { shopId_userId: { shopId, userId } },
  });
  if (!membership) {
    throw new AppError(
      "Unauthorized: You do not have access to this shop.",
      403,
    );
  }
  if (membership.role !== "OWNER" && membership.role !== "MANAGER") {
    throw new AppError("Unauthorized: Only owners and managers can manage staff.", 403);
  }
  return membership;
};

export const getStaff = async (shopId: string, userId: string) => {
  await ownerCheck(shopId, userId);

  const staff = await prisma.shopUser.findMany({
    where: { shopId },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return { staff };
};

export const createStaff = async (
  shopId: string,
  userId: string,
  data: CreateStaffData,
) => {
  await ownerCheck(shopId, userId);

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    // Check if already a member of this shop
    const existingMembership = await prisma.shopUser.findUnique({
      where: { shopId_userId: { shopId, userId: existingUser.id } },
    });
    if (existingMembership) {
      throw new AppError("This user is already a member of your shop.", 409);
    }
    // User exists but not in this shop — just add them
    const shopUser = await prisma.shopUser.create({
      data: { shopId, userId: existingUser.id, role: data.role },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    return { staff: shopUser };
  }

  // New user — create account + membership in one transaction
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
      },
    });

    const shopUser = await tx.shopUser.create({
      data: { shopId, userId: newUser.id, role: data.role },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return shopUser;
  });

  return { staff: result };
};

export const removeStaff = async (
  shopId: string,
  userId: string,
  shopUserId: string,
) => {
  await ownerCheck(shopId, userId);

  const membership = await prisma.shopUser.findUnique({
    where: { id: shopUserId },
  });

  if (!membership || membership.shopId !== shopId) {
    throw new AppError("Staff member not found.", 404);
  }

  if (membership.role === "OWNER") {
    throw new AppError("Cannot remove the shop owner.", 403);
  }

  await prisma.shopUser.delete({ where: { id: shopUserId } });

  return { message: "Staff member removed successfully." };
};
