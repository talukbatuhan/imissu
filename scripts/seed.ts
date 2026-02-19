
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const runSeed = async () => {
    if (!process.env.POSTGRES_URL) {
        throw new Error("POSTGRES_URL is not defined");
    }

    const connectionString = process.env.POSTGRES_URL;
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    console.log("🌱 Seeding database...");

    try {
        // Clear existing data (optional, but good for idempotent testing)
        // await db.delete(schema.assets).execute();
        // await db.delete(schema.products).execute();
        // await db.delete(schema.categories).execute();

        // 1. Create Root Categories
        const rootCategories = await db.insert(schema.categories).values([
            {
                name: "Polyurethane",
                slug: "polyurethane",
                description: "High-quality polyurethane products",
                sortOrder: 1,
            },
            {
                name: "Packaging Products",
                slug: "packaging-products",
                description: "Protective packaging solutions",
                sortOrder: 2,
            },
        ]).returning();

        const polyurethane = rootCategories.find((c) => c.slug === "polyurethane");
        const packaging = rootCategories.find((c) => c.slug === "packaging-products");

        console.log("✅ Root categories created");

        // 2. Create Child Categories
        if (polyurethane) {
            await db.insert(schema.categories).values([
                {
                    name: "Decorative Panels",
                    slug: "decorative-panels",
                    parentId: polyurethane.id,
                    sortOrder: 1,
                },
                {
                    name: "Crown Moldings",
                    slug: "crown-moldings",
                    parentId: polyurethane.id,
                    sortOrder: 2,
                },
            ]);
        }

        if (packaging) {
            await db.insert(schema.categories).values([
                {
                    name: "Corner Protectors",
                    slug: "corner-protectors",
                    parentId: packaging.id,
                    sortOrder: 1,
                },
            ]);
        }

        console.log("✅ Child categories created");

        console.log("🎉 Seeding completed successfully!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await client.end();
    }
};

runSeed();
