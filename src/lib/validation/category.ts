import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});
export type CategoryData = z.infer<typeof categorySchema>;
