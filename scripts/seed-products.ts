
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const runSeedProducts = async () => {
    if (!process.env.POSTGRES_URL) {
        throw new Error("POSTGRES_URL is not defined");
    }

    const connectionString = process.env.POSTGRES_URL;
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    console.log("🌱 Seeding products...");

    try {
        // 1. Fetch existing categories
        const allCategories = await db.select().from(schema.categories);

        if (allCategories.length === 0) {
            console.error("❌ No categories found. Run 'npx tsx scripts/seed.ts' first.");
            return;
        }

        // Helper to get random category
        const getRandomCategory = () => allCategories[Math.floor(Math.random() * allCategories.length)];

        const dummyProducts = [
            {
                name: "Acoustic Insulation Panel A1",
                sku: "PNL-AC-001",
                description: "High performance acoustic panel for soundproofing studios and offices.",
                dimensions: "60x60x5 cm",
                status: "published",
                specifications: [
                    { key: "Density", value: "30 dns" },
                    { key: "Fire Rating", value: "B1" },
                    { key: "Color", value: "Anthracite" }
                ],
            },
            {
                name: "Decorative Ceiling Rose CR-20",
                sku: "DEC-CR-020",
                description: "Classic style ceiling rose for decorative lighting fixtures.",
                dimensions: "40cm diameter",
                status: "published",
                specifications: [
                    { key: "Material", value: "Polyurethane" },
                    { key: "Weight", value: "350g" }
                ],
            },
            {
                name: "Corner Guard Heavy Duty",
                sku: "PKG-CG-500",
                description: "Heavy duty corner protector for shipping pallets.",
                dimensions: "10x10x10 cm",
                status: "draft",
                specifications: [
                    { key: "Material", value: "High Density Foam" },
                    { key: "Pack Size", value: "100 pcs" }
                ],
            },
            {
                name: "Wall Moulding Profile W-55",
                sku: "DEC-WL-055",
                description: "Elegant wall moulding for frame creation.",
                dimensions: "240x4x2 cm",
                status: "published",
                specifications: [
                    { key: "Length", value: "240 cm" },
                    { key: "Primed", value: "Yes" }
                ],
            },
            {
                name: "Insulation Board XPS",
                sku: "INS-XPS-300",
                description: "Thermal insulation board for construction.",
                dimensions: "120x60x3 cm",
                status: "archived",
                specifications: [
                    { key: "Thermal Conductivity", value: "0.035 W/mK" }
                ],
            }
        ];

        // Randomly assign categories and insert
        for (const p of dummyProducts) {
            const cat = getRandomCategory();
            await db.insert(schema.products).values({
                ...p,
                categoryId: cat.id,
                // Cast specs to any/json compatible type if needed by TS, but schema handles jsonb
                // Drizzle should handle array of objects fine for jsonb
            }).onConflictDoNothing(); // Simply skip if exists (SKU conflict)
        }

        console.log(`✅ Seeded ${dummyProducts.length} products successfully.`);

    } catch (error) {
        console.error("❌ Product seeding failed:", error);
    } finally {
        await client.end();
    }
};

runSeedProducts();
