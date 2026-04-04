import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginUser, refresh, registerUser } from "@/lib/auth";
import { AppError } from "@/lib/error";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await registerUser(body);

    return NextResponse.json(
      {
        success: true,
        data,
        error: null,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || "Internal Server Error",
      },
      { status: error instanceof AppError ? error.statusCode : 500 },
    );
  }
}