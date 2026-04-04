import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refresh } from "@/lib/auth";
import { AppError } from "@/lib/error";


export async function POST(req: Request) {
  try {
    const refreshToken = (await cookies()).get("refreshToken")?.value;
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "No refresh token provided",
        },
        { status: 401 },
      );
    }

    const data = await refresh(refreshToken);

    return NextResponse.json(
      {
        success: true,
        data,
        error: null,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Refresh token error:", error);
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