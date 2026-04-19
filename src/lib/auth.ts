import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { AppError } from "./error";
import {
  LoginData,
  LoginSchema,
  RegisterData,
  RegisterSchema,
} from "./validation/auth";

export const registerUser = async (data: RegisterData) => {
  const validation = RegisterSchema.parse(data);

  const existingUser = await prisma.user.findUnique({
    where: { email: validation.email },
  });
  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(validation.password, 12);

  // Perform Transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: validation.email,
        name: validation.name,
        phone: validation.phone,
        passwordHash: hashedPassword,
      },
    });

    const shop = await tx.shop.create({
      data: {
        name: validation.shopName,
        phone: validation.shopPhone,
        location: validation.location,
      },
    });

    const shopUser = await tx.shopUser.create({
      data: {
        shopId: shop.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    return { user, shop, shopUser };
  });

  // Strip sensitive data (Don't leak passwordHash)
  const { passwordHash, ...userWithoutPassword } = result.user;

  return {
    user: userWithoutPassword,
    shop: result.shop,
    shopUser: result.shopUser,
  };
};

export const loginUser = async (data: LoginData) => {
  const validation = LoginSchema.parse(data);

  // find the user by email
  const existingUser = await prisma.user.findUnique({
    where: { email: validation.email },
  });
  if (!existingUser) {
    throw new AppError("Invalid email or password", 401);
  }

  // compare password
  const comparePassword = await bcrypt.compare(
    validation.password,
    existingUser.passwordHash,
  );
  if (!comparePassword) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
  const refreshSecret = new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET,
  );

  // generate access token
  const accessToken = await new SignJWT({ userId: existingUser.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret);

  // generate refresh token
  const refreshToken = await new SignJWT({ userId: existingUser.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret);

  const user = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    phone: existingUser.phone,
  };

  return { accessToken, refreshToken, user };
};

export const refresh = async (refreshToken: string) => {
  const refreshSecret = new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET,
  );
  const verify = await jwtVerify(refreshToken, refreshSecret);
  if (!verify || typeof verify === "string") {
    throw new AppError("Invalid refresh token", 401);
  }

  const userId = verify.payload.userId as string;
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // generate new access token
  const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
  const accessToken = await new SignJWT({ userId: existingUser.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret);

  return { accessToken };
};

export const authMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return { user };
};
