import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  unit: z.string().default("pcs"),
  buyingPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  stockQty: z.number().nonnegative(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const UpdateProductSchema = ProductSchema.partial();

// Automatically generate the type from the schema!
export type ProductData = z.infer<typeof ProductSchema>;
export type UpdateProductData = z.infer<typeof UpdateProductSchema>;
