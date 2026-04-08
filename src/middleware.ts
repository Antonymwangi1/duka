import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

interface JwtPayload {
  userId: string;
}

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);

export async function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    // CRITICAL: Destructure 'payload' from the result
    const { payload } = await jwtVerify(token, ACCESS_SECRET);

    // Safety check: ensure userId exists in the payload
    const userId = payload.userId as string;

    if (!userId) {
      throw new Error("User ID missing in token");
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    console.error("Verify error:", err);
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
