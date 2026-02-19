
import { db } from "./db";
import { categories, products } from "./schema";
import { eq, asc, desc } from "drizzle-orm";

export type CategoryNode = typeof categories.$inferSelect & {
    children: CategoryNode[];
};

export async function getCategoryTree(): Promise<CategoryNode[]> {
    // Fetch all categories
    const allCategories = await db
        .select()
        .from(categories)
        .orderBy(asc(categories.sortOrder), asc(categories.name));

    const categoryMap = new Map<string, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    // Initialize map
    allCategories.forEach((cat) => {
        // @ts-ignore - explicitly creating structure
        categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build tree
    allCategories.forEach((cat) => {
        const node = categoryMap.get(cat.id)!;
        if (cat.parentId && categoryMap.has(cat.parentId)) {
            categoryMap.get(cat.parentId)!.children.push(node);
        } else {
            // @ts-ignore
            rootCategories.push(node);
        }
    });

    return rootCategories;
}

export async function getCategoryBySlug(slug: string) {
    const category = await db.query.categories.findFirst({
        where: eq(categories.slug, slug),
    });
    return category;
}

export async function getProductsByCategory(categoryId: string) {
    const data = await db.select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        status: products.status,
        updatedAt: products.updatedAt,
        // We can add image preview if we join assets, but for now keep it simple to match Product List
    })
        .from(products)
        .where(eq(products.categoryId, categoryId))
        .orderBy(desc(products.updatedAt));

    return data;
}
