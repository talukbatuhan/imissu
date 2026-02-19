
const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connectionString = process.env.POSTGRES_URL;

if (!supabaseUrl || !supabaseKey || !connectionString) {
    console.error("Missing config");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const sql = postgres(connectionString, { ssl: 'require' });

async function syncImages() {
    console.log("Starting sync from 'images' bucket to 'assets' table...");

    let count = 0;
    let page = 0;
    const limit = 100;

    // Check existing files to avoid duplicates
    const existingAssets = await sql`SELECT storage_path FROM assets WHERE storage_path LIKE 'images/%'`;
    const existingPaths = new Set(existingAssets.map(a => a.storage_path));
    console.log(`Found ${existingPaths.size} existing assets from 'images' bucket.`);

    while (true) {
        const { data: files, error } = await supabase.storage.from('images').list('', {
            limit: limit,
            offset: page * limit,
            sortBy: { column: 'name', order: 'asc' }
        });

        if (error) {
            console.error("Error listing files:", error);
            break;
        }

        if (!files || files.length === 0) {
            break;
        }

        const newFiles = files.filter(f => !existingPaths.has(`images/${f.name}`) && f.metadata); // ensure it's a file

        if (newFiles.length > 0) {
            const values = newFiles.map(f => ({
                file_name: f.name,
                file_type: f.metadata.mimetype || 'image/unknown',
                file_url: `${supabaseUrl}/storage/v1/object/public/images/${f.name}`,
                storage_path: `images/${f.name}`, // Linking to legacy bucket
                created_at: f.created_at || new Date().toISOString()
            }));

            // Insert in batches
            await sql`
                INSERT INTO assets ${sql(values, 'file_name', 'file_type', 'file_url', 'storage_path', 'created_at')}
            `;

            count += newFiles.length;
            console.log(`Synced ${count} files...`);
        }

        if (files.length < limit) break;
        page++;
    }

    console.log(`Sync complete. Added ${count} new assets.`);
    await sql.end();
}

syncImages().catch(console.error);
