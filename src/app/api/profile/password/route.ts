import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { changePassword } from "@/lib/profile";
import { NextRequest } from "next/server";
import { z } from "zod";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PATCH(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(body);

    const data = await changePassword(userId, currentPassword, newPassword);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
