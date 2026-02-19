"use server";

import { db } from "@/lib/db";
import { assets } from "@/lib/schema";
import { eq, isNull, desc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type Asset = typeof assets.$inferSelect;

export async function getUnassignedAssets(page = 1, pageSize = 24) {
    const offset = (page - 1) * pageSize;

    // 1. Get total count of unassigned assets
    const [totalResult] = await db
        .select({ value: count() })
        .from(assets)
        .where(isNull(assets.productId));

    const totalCount = totalResult.value;

    // 2. Get paginated assets
    const unassignedAssets = await db.query.assets.findMany({
        where: isNull(assets.productId),
        limit: pageSize,
        offset: offset,
        orderBy: desc(assets.uploadedAt),
    });

    return {
        data: unassignedAssets,
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
        page
    };
}

export async function assignAssetToProduct(assetId: string, productId: string) {
    try {
        await db.update(assets)
            .set({ productId: productId })
            .where(eq(assets.id, assetId));

        revalidatePath("/dashboard/assets");
        revalidatePath(`/dashboard/products/${productId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to assign asset:", error);
        return { success: false, error: "Failed to assign asset" };
    }
}

export async function deleteAsset(assetId: string) {
    try {
        // Re-using the logic from existing deleteAsset but making sure it handles unassigned ones
        // We can actually import the existing deleteAsset from ./assets.ts if we export it correctly 
        // or just use this file for new actions. 
        // However, it's better to keep actions in one place or splitting logical domains.
        // Let's defer to the existing ./assets.ts but we need to update it to support unassigned checks if needed.
        // For now, let's keep the existing deleteAsset in assets.ts and use it.
        return { success: false, error: "Use existing action" };
    } catch (error) {
        return { success: false, error: "Failed" };
    }
}
