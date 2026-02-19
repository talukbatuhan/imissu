
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role for Admin tasks

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or Service Role Key");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
    console.log("🗄️ Setting up Supabase Storage...");

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("❌ Failed to list buckets:", error);
        return;
    }

    const bucketName = "products";
    const existingBucket = buckets.find(b => b.name === bucketName);

    if (!existingBucket) {
        console.log(`Creating bucket: ${bucketName}...`);
        const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
        });

        if (createError) {
            console.error("❌ Failed to create bucket:", createError);
        } else {
            console.log("✅ Bucket 'products' created successfully.");
        }
    } else {
        console.log(`✅ Bucket '${bucketName}' already exists.`);
    }
}

setupStorage();
