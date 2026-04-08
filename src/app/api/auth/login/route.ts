import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { AppError } from "@/lib/error";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await loginUser(body);

    // return data without refresh token in the response body, we will set it in an HttpOnly cookie
    const { refreshToken, ...loginData } = data;

    // Set HttpOnly cookie with the refresh token
    const response = NextResponse.json(
      {
        success: true,
        data: loginData,
        error: null,
      },
      { status: 200 },
    );

    response.cookies.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || "Internal server error",
      },
      { status: error instanceof AppError ? error.statusCode : 500 },
    );
  }
}
