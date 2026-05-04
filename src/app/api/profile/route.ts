import { apiError, apiResponse, getUserId } from "@/lib/helpers/request";
import { updateProfile } from "@/lib/profile";
import { NextRequest } from "next/server";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const validatedData = UpdateProfileSchema.parse(body);

    const data = await updateProfile(userId, validatedData);
    return apiResponse(data);
  } catch (error: any) {
    return apiError(error);
  }
}
