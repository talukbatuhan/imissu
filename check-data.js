
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function main() {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
        console.error("No POSTGRES_URL found in .env.local");
        return;
    }

    console.log("Connecting to:", connectionString.replace(/:[^:]*@/, ':***@')); // Hide password

    const sql = postgres(connectionString, { ssl: 'require' });

    try {
        console.log("Checking tables...");
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log("Tables found:", tables.map(t => t.table_name));

        console.log("\nChecking row counts:");
        for (const table of tables) {
            const count = await sql`SELECT count(*) FROM ${sql(table.table_name)}`;
            console.log(`${table.table_name}: ${count[0].count}`);
        }

        console.log("\nChecking constraints on assets:");
        const constraints = await sql`
            SELECT * FROM information_schema.table_constraints
            WHERE table_name = 'assets'
        `;
        console.log(constraints.map(c => c.constraint_name));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.end();
    }
}

main();
