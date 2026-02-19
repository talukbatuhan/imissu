
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

async function main() {
    console.log("Running note history migration...");

    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
        console.error("POSTGRES_URL is missing");
        return;
    }

    console.log("ConnectionString found (masked):", connectionString.replace(/:[^:@]+@/, ":***@"));

    const sql = postgres(connectionString, {
        ssl: { rejectUnauthorized: false },
        prepare: false
    });

    try {
        console.log("Creating asset_note_history table...");
        await sql`
            CREATE TABLE IF NOT EXISTS asset_note_history (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
                note text NOT NULL,
                created_at timestamp DEFAULT now() NOT NULL
            );
        `;
        console.log("Created asset_note_history table.");
        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

main();
