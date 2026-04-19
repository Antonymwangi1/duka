import { authMe } from "@/lib/auth";
import { AppError } from "@/lib/error";
import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { useAuthStore } from "@/store/useAuthStore";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const data = await authMe(userId);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
