
"use server";

import { db } from "@/lib/db";
import { assets, products, assetDocuments, assetNoteHistory } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { eq, desc, count, inArray, ilike, isNull, isNotNull, and } from "drizzle-orm";
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
        .where(and(
            isNull(assets.deletedAt),
            query ? ilike(assets.fileName, `%${query}%`) : undefined
        ));

    const totalCount = totalResult.value;

    // 2. Get paginated assets with product relation
    const allAssets = await db.query.assets.findMany({
        where: and(
            isNull(assets.deletedAt),
            query ? ilike(assets.fileName, `%${query}%`) : undefined
        ),
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

export async function getAssetNoteHistory(assetId: string) {
    const history = await db.query.assetNoteHistory.findMany({
        where: eq(assetNoteHistory.assetId, assetId),
        orderBy: desc(assetNoteHistory.createdAt)
    });
    return history;
}

export async function updateAssetNote(assetId: string, notes: string) {
    try {
        // 1. Save to History
        if (notes) {
            await db.insert(assetNoteHistory).values({
                assetId,
                note: notes
            });
        }

        // 2. Update DB
        await db.update(assets)
            .set({ notes })
            .where(eq(assets.id, assetId));

        // 3. Backup to Supabase Storage (Text File)
        // DISABLED: Bucket configuration prevents text/plain uploads. 
        // Database (asset.notes and asset_note_history) is the primary source of truth.
        /*
        const asset = await db.query.assets.findFirst({
            where: eq(assets.id, assetId)
        });

        if (asset && asset.storagePath) {
            // Extract folder from storagePath
            const pathParts = asset.storagePath.split('/');
            const fileName = pathParts.pop();
            const folderPath = pathParts.join('/');
            const noteFileName = `${fileName}.notes.txt`;
            const noteFilePath = folderPath ? `${folderPath}/${noteFileName}` : noteFileName;

            // Upload text content
            const { error } = await supabaseAdmin.storage
                .from("products") // Assuming 'products' bucket
                .upload(noteFilePath, notes, {
                    contentType: 'text/plain',
                    upsert: true
                });

            if (error) {
                console.error("Failed to backup note to storage:", error);
                // Don't fail the whole request, just log it
            }
        }
        */

        revalidatePath("/dashboard/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to update asset note:", error);
        return { success: false, error: "Failed to update asset note" };
    }
}

export async function deleteAsset(assetId: string) {
    try {
        await db.update(assets)
            .set({ deletedAt: new Date() })
            .where(eq(assets.id, assetId));

        revalidatePath("/dashboard/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete asset:", error);
        return { success: false, error: "Failed to delete asset" };
    }
}

export async function bulkDeleteAssets(assetIds: string[]) {
    try {
        if (!assetIds.length) return { success: true };

        await db.update(assets)
            .set({ deletedAt: new Date() })
            .where(inArray(assets.id, assetIds));

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

// Recycle Bin Actions

export async function getDeletedAssets() {
    const deletedAssets = await db.query.assets.findMany({
        where: isNotNull(assets.deletedAt),
        orderBy: desc(assets.deletedAt),
        with: {
            product: true
        }
    });
    return deletedAssets as AssetWithProduct[];
}

export async function restoreAsset(assetIds: string[]) {
    try {
        if (!assetIds.length) return { success: true };
        await db.update(assets)
            .set({ deletedAt: null })
            .where(inArray(assets.id, assetIds));

        revalidatePath("/dashboard/trash");
        revalidatePath("/dashboard/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to restore assets:", error);
        return { success: false, error: "Başarısız" };
    }
}

export async function permanentDeleteAsset(assetIds: string[]) {
    try {
        if (!assetIds.length) return { success: true };

        // Get assets to find storage paths before deleting
        const assetsToDelete = await db.query.assets.findMany({
            where: inArray(assets.id, assetIds),
        });

        const storagePaths = assetsToDelete
            .filter(a => a.storagePath.startsWith("products/"))
            .map(a => a.storagePath);

        if (storagePaths.length > 0) {
            await supabaseAdmin.storage.from("products").remove(storagePaths);
        }

        // Also delete associated documents files? (Ideally yes, but let's stick to base logic)

        await db.delete(assets).where(inArray(assets.id, assetIds));

        revalidatePath("/dashboard/trash");
        return { success: true };
    } catch (error) {
        console.error("Failed to permanently delete assets:", error);
        return { success: false, error: "Başarısız" };
    }
}

// Document Actions

export async function addAssetDocument(data: {
    assetId: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
}) {
    try {
        await db.insert(assetDocuments).values({
            assetId: data.assetId,
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            fileSize: data.fileSize,
        });
        revalidatePath("/dashboard/assets");
        return { success: true };
    } catch (error) {
        console.error("Failed to add document:", error);
        return { success: false };
    }
}

export async function getAssetDocuments(assetId: string) {
    return await db.query.assetDocuments.findMany({
        where: eq(assetDocuments.assetId, assetId),
        orderBy: desc(assetDocuments.uploadedAt),
    });
}

export async function deleteAssetDocument(documentId: string) {
    try {
        await db.delete(assetDocuments).where(eq(assetDocuments.id, documentId));
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
