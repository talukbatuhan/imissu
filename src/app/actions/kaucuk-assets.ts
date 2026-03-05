"use server";

import type { AssetWithProduct } from "@/app/actions/assets";
import { db } from "@/lib/db";
import { getNewProduct2Images } from "@/lib/images";
import { getNewProduct2ImageUrl } from "@/lib/supabase";
import { assets } from "@/lib/schema";
import { and, inArray, isNull } from "drizzle-orm";

export async function getKaucukAssets(page = 1, pageSize = 24, query = "") {
    const allFiles = await getNewProduct2Images();

    let filteredFiles = allFiles;
    if (query) {
        const q = query.toLowerCase();
        filteredFiles = allFiles.filter((f) => f.toLowerCase().includes(q));
    }

    const total = filteredFiles.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageFiles = filteredFiles.slice(start, end);

    if (pageFiles.length === 0) {
        return {
            data: [] as AssetWithProduct[],
            totalCount: total,
            page,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    const existing = await db
        .select({ storagePath: assets.storagePath })
        .from(assets)
        .where(inArray(assets.storagePath, pageFiles));

    const existingPaths = new Set(existing.map((r) => r.storagePath));
    const missingPaths = pageFiles.filter((p) => !existingPaths.has(p));

    if (missingPaths.length > 0) {
        await db.insert(assets).values(
            missingPaths.map((storagePath) => ({
                productId: null,
                fileName: storagePath,
                fileType: storagePath.match(/\.(pdf)$/i) ? "document" : "image",
                fileUrl: getNewProduct2ImageUrl(storagePath),
                storagePath,
                width: null,
                height: null,
                notes: null,
                deletedAt: null,
            }))
        );
    }

    const pageAssets = await db.query.assets.findMany({
        where: and(isNull(assets.deletedAt), inArray(assets.storagePath, pageFiles)),
        with: {
            product: true,
        },
    });

    const byPath = new Map(pageAssets.map((a) => [a.storagePath, a as AssetWithProduct]));
    const data = pageFiles.map((p) => byPath.get(p)).filter(Boolean) as AssetWithProduct[];

    return {
        data,
        totalCount: total,
        page,
        totalPages: Math.ceil(total / pageSize),
    };
}
