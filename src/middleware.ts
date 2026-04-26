import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

const PUBLIC_PAGE_ROUTES = ["/login", "/register"];
const UNPROTECTED_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── API routes ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/api")) {
    if (UNPROTECTED_API_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    try {
      const { payload } = await jwtVerify(token, ACCESS_SECRET);
      const userId = payload.userId as string;
      if (!userId) throw new Error("User ID missing in token");

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", userId);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized: Invalid or expired token" },
        { status: 401 },
      );
    }
  }

  // ── Page routes ──────────────────────────────────────────────────────────
  const isPublicPage = PUBLIC_PAGE_ROUTES.some((r) => pathname.startsWith(r));
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (isPublicPage && refreshToken) {
    try {
      await jwtVerify(refreshToken, REFRESH_SECRET);
      return NextResponse.redirect(new URL("/overview", req.url));
    } catch {
      return NextResponse.next();
    }
  }

  if (!isPublicPage && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};