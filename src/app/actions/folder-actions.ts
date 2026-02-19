"use server";

import { db } from "@/lib/db";
import { products, categories } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getFolders() {
    return await db.select({
        id: products.id,
        name: products.name,
    })
        .from(products)
        .orderBy(desc(products.updatedAt));
}

export async function createFolder(name: string) {
    try {
        // 1. Get a default category or create one
        let defaultCategory = await db.query.categories.findFirst();

        if (!defaultCategory) {
            const [newCat] = await db.insert(categories).values({
                name: "Genel",
                slug: "genel",
            }).returning();
            defaultCategory = newCat;
        }

        // 2. Create Product (Folder)
        await db.insert(products).values({
            name: name,
            sku: `FOLDER-${Date.now()}`, // Auto-generate SKU
            categoryId: defaultCategory.id,
            status: "published",
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/assets");

        return { success: true };
    } catch (error) {
        console.error("Failed to create folder:", error);
        return { success: false, error: "Klasör oluşturulamadı" };
    }
}
