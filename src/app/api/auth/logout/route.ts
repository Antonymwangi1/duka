import { NextResponse } from "next/server";
import { AppError } from "@/lib/error";

export async function POST(req: Request) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        data: null,
        error: null,
      },
      { status: 200 },
    );

    // Clear the refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
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
