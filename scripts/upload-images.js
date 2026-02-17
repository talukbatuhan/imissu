const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
const BUCKET_NAME = 'images';

async function uploadImages() {
    console.log(`Starting upload from ${IMAGES_DIR} to bucket '${BUCKET_NAME}'...`);

    if (!fs.existsSync(IMAGES_DIR)) {
        console.error("Images directory not found.");
        return;
    }

    const files = fs.readdirSync(IMAGES_DIR).filter(file =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
    );

    // Sort naturally
    files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    console.log(`Found ${files.length} images.`);

    // Create bucket if it doesn't exist (optional)
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    if (bucketError && !bucketError.message.includes('already exists')) {
        console.warn("Bucket creation warning:", bucketError.message);
    }

    let successCount = 0;
    let errorCount = 0;

    // Process in batches of 10 to avoid overwhelming connections
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        console.log(`Processing batch ${i + 1} - ${Math.min(i + batchSize, files.length)} of ${files.length}...`);

        await Promise.all(batch.map(async (file) => {
            try {
                const filePath = path.join(IMAGES_DIR, file);
                const fileBuffer = fs.readFileSync(filePath);

                const { error } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(file, fileBuffer, {
                        contentType: 'image/jpeg', // Simple guess
                        upsert: true
                    });

                if (error) {
                    console.error(`❌ Failed to upload ${file}:`, error.message);
                    errorCount++;
                } else {
                    process.stdout.write('.'); // Simple progress indicator
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ Unexpected error uploading ${file}:`, err);
                errorCount++;
            }
        }));
        console.log(""); // Newline after batch dots
    }

    console.log(`Upload complete. Success: ${successCount}, Errors: ${errorCount}`);
}

uploadImages();
