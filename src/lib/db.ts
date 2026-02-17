import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false, ssl: "require" });
export const db = drizzle(client, { schema });
