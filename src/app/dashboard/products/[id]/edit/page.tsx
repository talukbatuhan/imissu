
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { categories } from "@/lib/schema";
import { ProductForm } from "@/components/products/product-form";
import { getCategoryOptions } from "@/app/actions/products";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductFormValues } from "@/lib/validations";

interface EditProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const { id } = await params;

    const product = await db.query.products.findFirst({
        where: eq(products.id, id),
    });

    if (!product) {
        notFound();
    }

    // Cast product to ProductFormValues (ensure types match especially for jsonb specifications)
    const initialData: ProductFormValues & { id: string } = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId || "",
        description: product.description || "",
        dimensions: product.dimensions || "",
        status: (product.status as "draft" | "published" | "archived") || "draft",
        specifications: (product.specifications as { key: string; value: string }[]) || [],
    };

    const categoryOptions = await getCategoryOptions();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Ürünü Düzenle</h2>
            </div>
            <ProductForm categories={categoryOptions} initialData={initialData} />
        </div>
    );
}
