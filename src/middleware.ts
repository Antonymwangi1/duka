import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

export async function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", (payload as JwtPayload).userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Unauthorized: Invalid or expired token",
      },
      { status: 401 },
    );
  }
}

export const config = {
  matcher: ["/api/((?!auth).*)"],
};
