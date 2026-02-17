import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
    imageKey: varchar("image_key", { length: 255 }).primaryKey(),
    content: text("content").default(""),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
