import { z } from "zod";

// Helper for Sale Items (Typically sent with the Sale)
export const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().positive("Quantity must be at least 1"),
});

export const SaleSchema = z.object({
  paymentMethod: z.enum(["CASH", "MPESA", "CARD", "CREDIT"]).default("CASH"),
  mpesaRef: z.string().optional().nullable(),

  discount: z.number().nonnegative().default(0),
  amountPaid: z.number().nonnegative(),

  // Metadata
  note: z.string().optional().nullable(),

  // Nested Items (Optional: Include this if creating Sale and Items together)
  items: z
    .array(SaleItemSchema)
    .min(1, "At least one item is required per sale"),
});

export type SaleData = z.infer<typeof SaleSchema>;
export type SaleItemData = z.infer<typeof SaleItemSchema>;
