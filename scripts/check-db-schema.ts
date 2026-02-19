
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const check = async () => {
    if (!process.env.POSTGRES_URL) {
        console.error("POSTGRES_URL is not defined");
        return;
    }
    const client = postgres(process.env.POSTGRES_URL);

    try {
        const result = await client`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products';
        `;
        console.log("Columns in products table:");
        result.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
};

check();
