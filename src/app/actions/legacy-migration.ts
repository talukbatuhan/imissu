
"use server";

import { assets, products } from "@/lib/schema";
import { getAllImages } from "@/lib/images"; // Existing function
import { getImageUrl } from "@/lib/supabase";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createAssetRecord } from "@/app/actions/assets";

/**
 * Lists files from Supabase 'images' bucket that are NOT yet linked in the 'assets' table.
 * This is for migration purposes.
 */
export async function getUnlinkedFiles(page = 1, limit = 50) {
    // 1. Get ALL images from Storage (cached)
    // In a real scenario, fetching 1000+ file names is fast.
    const allFiles = await getAllImages(); // Returns file names like "image1.jpg"

    // 2. Get all currently linked file names from DB 'assets' table
    // (Optimization: only fetch distinct fileNames)
    const linkedAssets = await db.select({ fileName: assets.fileName }).from(assets);
    const linkedFileNames = new Set(linkedAssets.map(a => a.fileName));

    // 3. Filter out files that are already linked
    const unlinkedFiles = allFiles.filter(f => !linkedFileNames.has(f));

    // 4. Paginate
    const total = unlinkedFiles.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedFiles = unlinkedFiles.slice(start, end).map(fileName => ({
        fileName,
        url: getImageUrl(fileName) // This assumes they are in root of 'images' bucket
    }));

    return {
        files: paginatedFiles,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Links an existing file from 'images' bucket to a Product.
 * This moves the record concepts, but keeps the file in physical storage unless we move it.
 * For now, we will just create an Asset record pointing to the old URL.
 */
export async function linkLegacyFileToProduct(productId: string, fileName: string) {
    const url = getImageUrl(fileName);

    // Determine file type
    const fileType = fileName.match(/\.(pdf)$/i) ? "document" : "image";

    await createAssetRecord({
        productId,
        fileName,
        fileType,
        fileUrl: url,
        storagePath: fileName, // It's in root of 'images' bucket
        // width/height unknown without processing
    });

    return { success: true };
}
