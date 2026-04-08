import { NextRequest, NextResponse } from "next/server";
import { AppError } from "../error";

export const getUserId = (req: NextRequest): string => {
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new AppError("Unauthorized", 401);
  return userId;
};

export const apiResponse = (data: any, status = 200) =>
  NextResponse.json({ success: true, data, error: null }, { status });

export const apiError = (error: AppError) =>
  NextResponse.json(
    { success: false, data: null, error: error.message },
    { status: error instanceof AppError ? error.statusCode : 500 },
  );
