
"use server";

import { db } from "@/lib/db";
import { products, categories } from "@/lib/schema";
import { eq, like, desc, asc, and, ilike } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { productSchema, ProductFormValues } from "@/lib/validations";

// --- ACTIONS ---

export async function createProduct(data: ProductFormValues) {
    try {
        // Convert array of specs back to object if needed, but DB schema is jsonb which accepts array or object.
        // Let's store specs as an array of objects straight into JSONB for easier editing, or convert to Record.
        // The requirement was "jsonb". Array of objects is fine.

        await db.insert(products).values({
            name: data.name,
            sku: data.sku,
            categoryId: data.categoryId,
            description: data.description,
            dimensions: data.dimensions,
            status: data.status,
            specifications: data.specifications,
        });

        revalidatePath("/dashboard/products");
        return { success: true, message: "Product created successfully." };
    } catch (error: any) {
        console.error("Failed to create product:", error);
        // Handle unique constraint violation for SKU
        if (error.code === '23505') {
            return { success: false, message: "A product with this SKU already exists." };
        }
        return { success: false, message: "Failed to create product." };
    }
}

export async function updateProduct(id: string, data: ProductFormValues) {
    try {
        await db.update(products).set({
            name: data.name,
            sku: data.sku,
            categoryId: data.categoryId,
            description: data.description,
            dimensions: data.dimensions,
            status: data.status,
            specifications: data.specifications,
        }).where(eq(products.id, id));

        revalidatePath("/dashboard/products");
        return { success: true, message: "Product updated successfully." };
    } catch (error: any) {
        console.error("Failed to update product:", error);
        if (error.code === '23505') {
            return { success: false, message: "A product with this SKU already exists." };
        }
        return { success: false, message: "Failed to update product." };
    }
}

import { supabaseAdmin } from "@/lib/supabase";
import { assets } from "@/lib/schema";

export async function deleteProduct(id: string) {
    try {
        // 1. Find all assets associated with this product that are in 'products' bucket
        // (Legacy assets in 'images' bucket should be preserved)
        // We need to query assets BEFORE deleting the product
        const productAssets = await db.select({
            storagePath: assets.storagePath
        })
            .from(assets)
            .where(eq(assets.productId, id));

        const pathsToDelete = productAssets
            .map(a => a.storagePath)
            .filter(path => path.startsWith("products/"));

        // 2. Delete files from storage
        if (pathsToDelete.length > 0) {
            const { error: storageError } = await supabaseAdmin.storage
                .from("products")
                .remove(pathsToDelete);

            if (storageError) {
                console.warn("Failed to delete product files from storage:", storageError);
            }
        }

        // 3. Delete product (cascade will delete asset records)
        await db.delete(products).where(eq(products.id, id));
        revalidatePath("/dashboard/products");
        return { success: true, message: "Ürün başarıyla silindi." };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, message: "Ürün silinemedi." };
    }
}

export async function getProducts({
    page = 1,
    pageSize = 10,
    search = "",
    categoryId = "",
}: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
}) {
    const offset = (page - 1) * pageSize;

    // Build query filters
    const conditions = [];
    if (search) {
        conditions.push(
            // Simple search on name OR sku
            // Drizzle ORM 'or' logic needs to be constructed carefully
            // But for simplicity let's search name for now or do raw SQL for complex OR if needed.
            // Actually, let's stick to name search first.
            ilike(products.name, `%${search}%`)
        );
    }
    if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId));
    }

    // Execute query
    const query = db.select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        status: products.status,
        categoryName: categories.name,
        updatedAt: products.updatedAt,
    })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .limit(pageSize)
        .offset(offset)
        .orderBy(desc(products.updatedAt));

    if (conditions.length > 0) {
        // @ts-ignore - basic filtering
        query.where(and(...conditions));
    }

    const data = await query;
    return data;
}

// Fetch simplified category list for the combobox
export async function getCategoryOptions() {
    const data = await db.select({
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId
    }).from(categories).orderBy(asc(categories.name));

    // We could format this to show hierarchy like "Parent > Child", but raw list is a good start.
    return data;
}
