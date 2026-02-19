
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket(bucketName) {
    console.log(`Checking bucket: ${bucketName}`);
    const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 100 });

    if (error) {
        console.error(`Error listing bucket ${bucketName}:`, error);
        return;
    }

    console.log(`Found ${data.length} files in root of ${bucketName}`);
    if (data.length > 0) {
        console.log("Sample files:", data.slice(0, 5).map(f => f.name));
    }

    // Check inside a folder if any
    const folders = data.filter(f => !f.metadata); // Folders usually lack metadata or identify as folder
    if (folders.length > 0) {
        console.log(`Checking folder: ${folders[0].name}`);
        const { data: sub } = await supabase.storage.from(bucketName).list(folders[0].name, { limit: 10 });
        console.log(`files in ${folders[0].name}:`, sub ? sub.length : 0);
    }
}

async function main() {
    await checkBucket('products');
    await checkBucket('images'); // legacy?
}

main();
