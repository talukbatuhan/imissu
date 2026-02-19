import { pgTable, text, timestamp, uuid, varchar, foreignKey, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Categories Table (Hierarchical)
export const categories = pgTable("categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    parentId: uuid("parent_id"),
    description: text("description"),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        parentFk: foreignKey({
            columns: [table.parentId],
            foreignColumns: [table.id],
            name: "categories_parent_id_fk",
        }),
    };
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: "category_parent",
    }),
    children: many(categories, {
        relationName: "category_parent",
    }),
    products: many(products),
}));

// Products Table
export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => categories.id),
    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }).unique().notNull(),
    description: text("description"),
    dimensions: varchar("dimensions", { length: 100 }), // e.g., "10x20x30 cm"
    specifications: jsonb("specifications"), // Structured specs (density, weight, etc.)
    status: varchar("status", { length: 50 }).default("draft"), // draft, published, archived
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    assets: many(assets),
}));

// Assets Table (DAM)
export const assets = pgTable("assets", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id, { onDelete: 'cascade' }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(), // image, pdf, drawing
    fileUrl: text("file_url").notNull(),
    isPrimary: boolean("is_primary").default(false), // Main product image
    storagePath: text("storage_path").notNull(), // For deletion/management
    width: integer("width"),
    height: integer("height"),
    notes: text("notes"), // User notes for this specific asset
    uploadedAt: timestamp("created_at").defaultNow().notNull(),
});

export const assetsRelations = relations(assets, ({ one }) => ({
    product: one(products, {
        fields: [assets.productId],
        references: [products.id],
    }),
}));
