"use server";

import { db } from "@/lib/db";
import { assets } from "@/lib/schema";
import { and, count, desc, ilike, isNotNull, isNull, ne } from "drizzle-orm";

export type AssetWithProduct = typeof assets.$inferSelect & {
    product: typeof import("@/lib/schema").products.$inferSelect | null;
};

export async function getAssetsWithNotes(params: {
    bucket: "products" | "new_products" | "new_products_2";
    page?: number;
    pageSize?: number;
    query?: string;
}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 24;
    const query = params.query ?? "";
    const offset = (page - 1) * pageSize;
    const bucketFilter = `%/object/public/${params.bucket}/%`;

    const where = and(
        isNull(assets.deletedAt),
        isNotNull(assets.notes),
        ne(assets.notes, ""),
        ilike(assets.fileUrl, bucketFilter),
        query ? ilike(assets.fileName, `%${query}%`) : undefined
    );

    const [totalResult] = await db
        .select({ value: count() })
        .from(assets)
        .where(where);

    const totalCount = totalResult.value;

    const pageAssets = await db.query.assets.findMany({
        where,
        limit: pageSize,
        offset,
        orderBy: desc(assets.uploadedAt),
        with: {
            product: true,
        },
    });

    return {
        data: pageAssets as AssetWithProduct[],
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
        page,
    };
}

export async function getAllAssetsWithNotes(page = 1, pageSize = 24, query = "") {
    const offset = (page - 1) * pageSize;

    const where = and(
        isNull(assets.deletedAt),
        isNotNull(assets.notes),
        ne(assets.notes, ""),
        query ? ilike(assets.fileName, `%${query}%`) : undefined
    );

    const [totalResult] = await db
        .select({ value: count() })
        .from(assets)
        .where(where);

    const totalCount = totalResult.value;

    const pageAssets = await db.query.assets.findMany({
        where,
        limit: pageSize,
        offset,
        orderBy: desc(assets.uploadedAt),
        with: {
            product: true,
        },
    });

    return {
        data: pageAssets as AssetWithProduct[],
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
        page,
    };
}
