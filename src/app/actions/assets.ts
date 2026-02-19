
"use server";

import { db } from "@/lib/db";
import { assets } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { eq, desc, count, inArray, ilike } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase";

export type AssetWithProduct = typeof assets.$inferSelect & {
    product: typeof import("@/lib/schema").products.$inferSelect | null;
};

export async function getAssets(page = 1, pageSize = 24, query = "") {
    const offset = (page - 1) * pageSize;

    // 1. Get total count
    const [totalResult] = await db
        .select({ value: count() })
        .from(assets)
        .where(query ? ilike(assets.fileName, `%${query}%`) : undefined);

    const totalCount = totalResult.value;

    // 2. Get paginated assets with product relation
    const allAssets = await db.query.assets.findMany({
        where: query ? ilike(assets.fileName, `%${query}%`) : undefined,
        limit: pageSize,
        offset: offset,
        orderBy: desc(assets.uploadedAt),
        with: {
            product: true
        }
    });

    return {
        data: allAssets as AssetWithProduct[],
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
        page
    };
}

// We don't need supabaseAdmin here yet unless deleting, 
// but adding asset record is a simple DB insert after client-side upload or server-side upload.
// For robust DAM, let's use client-side upload for speed, then server action to record it.

export async function createAssetRecord(data: {
    productId: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    storagePath: string;
    width?: number;
    height?: number;
}) {
    try {
        await db.insert(assets).values({
            productId: data.productId,
            fileName: data.fileName,
            fileType: data.fileType,
            fileUrl: data.fileUrl,
            storagePath: data.storagePath,
            width: data.width,
            height: data.height,
        });

        revalidatePath(`/dashboard/products/${data.productId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create asset record:", error);
        return { success: false, error: "Failed to create asset record" };
    }
}

export async function updateAssetNote(assetId: string, notes: string) {
    try {
        await db.update(assets)
            .set({ notes })
            .where(eq(assets.id, assetId));

        revalidatePath("/dashboard/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to update asset note:", error);
        return { success: false, error: "Failed to update asset note" };
    }
}

export async function deleteAsset(assetId: string) {
    try {
        // 1. Get the asset to check storage path
        const asset = await db.query.assets.findFirst({
            where: eq(assets.id, assetId),
        });

        if (!asset) {
            return { success: false, error: "Asset not found" };
        }

        // 2. If it's a new asset (in 'products' bucket), delete from storage
        // Legacy assets (in 'images' bucket) are preserved to become 'unassigned' again
        if (asset.storagePath.startsWith("products/")) {
            const { error: storageError } = await supabaseAdmin.storage
                .from("products")
                .remove([asset.storagePath]);

            if (storageError) {
                console.warn("Failed to delete file from storage:", storageError);
                // Continue to delete record anyway
            }
        }

        // 3. Delete from DB
        await db.delete(assets).where(eq(assets.id, assetId));

        revalidatePath(`/dashboard/products/${asset.productId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete asset:", error);
        return { success: false, error: "Failed to delete asset" };
    }
}

export async function bulkDeleteAssets(assetIds: string[]) {
    try {
        if (!assetIds.length) return { success: true };

        // 1. Get assets to find storage paths
        const assetsToDelete = await db.query.assets.findMany({
            where: inArray(assets.id, assetIds),
        });

        // 2. Delete from storage (only if in products bucket)
        const storagePaths = assetsToDelete
            .filter(a => a.storagePath.startsWith("products/"))
            .map(a => a.storagePath);

        if (storagePaths.length > 0) {
            const { error: storageError } = await supabaseAdmin.storage
                .from("products")
                .remove(storagePaths);

            if (storageError) {
                console.warn("Failed to delete files from storage:", storageError);
            }
        }

        // 3. Delete from DB
        await db.delete(assets).where(inArray(assets.id, assetIds));

        revalidatePath("/dashboard/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to bulk delete assets:", error);
        return { success: false, error: "Failed to bulk delete assets" };
    }
}

export async function bulkAssignAssets(assetIds: string[], productId: string) {
    try {
        if (!assetIds.length) return { success: true };

        await db.update(assets)
            .set({ productId })
            .where(inArray(assets.id, assetIds));

        revalidatePath("/dashboard/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to bulk assign assets:", error);
        return { success: false, error: "Failed to bulk assign assets" };
    }
}
