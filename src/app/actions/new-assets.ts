"use server";

import { getNewProductImages } from "@/lib/images";
import { getNewProductImageUrl } from "@/lib/supabase";

export interface NewAsset {
    fileName: string;
    url: string;
}

export async function getNewAssets(page = 1, limit = 50, query = "") {
    // 1. Get ALL images from Storage (cached)
    const allFiles = await getNewProductImages();

    // 2. Filter by query if exists
    let filteredFiles = allFiles;
    if (query) {
        filteredFiles = allFiles.filter(f => f.toLowerCase().includes(query.toLowerCase()));
    }

    // 3. Paginate
    const total = filteredFiles.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    const paginatedFiles = filteredFiles.slice(start, end).map(fileName => ({
        fileName,
        url: getNewProductImageUrl(fileName)
    }));

    return {
        data: paginatedFiles,
        totalCount: total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}
