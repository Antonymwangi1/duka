import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { AppError } from "./error";

interface RegisterInput {
  email: string;
  name: string;
  phone?: string;
  password: string;
  shopName: string;
  shopPhone?: string;
  location?: string;
}

export const registerUser = async (data: RegisterInput) => {
  const { email, name, phone, password, shopName, shopPhone, location } = data;

  if (!email || !password || !shopName || !name) {
    throw new AppError("Missing required fields", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Perform Transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash: hashedPassword,
      },
    });

    const shop = await tx.shop.create({
      data: {
        name: shopName,
        phone: shopPhone,
        location,
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

export const loginUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new AppError("Missing required fields", 400);
  }
  // find the user by email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (!existingUser) {
    throw new AppError("Invalid email or password", 401);
  }

  // compare password
  const comparePassword = await bcrypt.compare(
    password,
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
