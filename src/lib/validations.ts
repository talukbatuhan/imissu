
import { z } from "zod";

// Ensure the Product Schema is robust
export const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    sku: z.string().min(2, "SKU must be at least 2 characters."),
    categoryId: z.string().uuid("Please select a valid category."),
    description: z.string().optional(),
    dimensions: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).default("draft"),
    specifications: z.array(
        z.object({
            key: z.string().min(1, "Key required"),
            value: z.string().min(1, "Value required"),
        })
    ).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
