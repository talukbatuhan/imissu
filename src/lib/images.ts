import { supabaseAdmin } from "./supabase";
import { unstable_cache } from "next/cache";

// Cache the image list for 1 hour to avoid spamming Storage API
export const getAllImages = unstable_cache(
    async () => {
        let allFiles: string[] = [];
        let page = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabaseAdmin.storage
                .from("images")
                .list("", {
                    limit,
                    offset: page * limit,
                    sortBy: { column: "name", order: "asc" },
                });

            if (error) {
                console.error("Error fetching images:", error);
                throw error;
            }

            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            const imageFiles = data
                .filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name))
                .map((file) => file.name);

            allFiles = [...allFiles, ...imageFiles];

            if (data.length < limit) {
                hasMore = false;
            }
            page++;
        }

        // Sort naturally (1, 2, 10 instead of 1, 10, 2)
        return allFiles.sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
        );
    },
    ["all-images-list"],
    { revalidate: 60, tags: ["images"] } // 1 minute cache, with tag for manual revalidation
);
