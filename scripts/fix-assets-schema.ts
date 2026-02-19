
import postgres from "postgres"; // Changed to default export
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const run = async () => {
    if (!process.env.POSTGRES_URL) {
        console.error("POSTGRES_URL is not defined");
        return;
    }
    const sql = postgres(process.env.POSTGRES_URL);

    try {
        console.log("Adding notes column to assets table...");
        await sql`ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes text;`;
        console.log("Done.");
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
};

run();
