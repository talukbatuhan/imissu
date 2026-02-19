
import { db } from "@/lib/db";
import { products, assets, categories } from "@/lib/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AssetGrid } from "@/components/assets/asset-grid";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { AssetUploader } from "@/components/assets/asset-uploader";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { UploadCloud } from "lucide-react";

interface ProductPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string; query?: string }>;
}

async function getProduct(id: string) {
    const result = await db
        .select({
            product: products,
            categoryName: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, id))
        .limit(1);

    if (result.length === 0) return null;
    return result[0];
}

async function getProductAssets(productId: string) {
    return await db
        .select()
        .from(assets)
        .where(and(
            eq(assets.productId, productId),
            isNull(assets.deletedAt)
        ))
        .orderBy(desc(assets.uploadedAt));
}

async function getAllProducts() {
    return await db.select({ id: products.id, name: products.name }).from(products).orderBy(desc(products.createdAt));
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
    const { id } = await params;
    const productData = await getProduct(id);

    if (!productData) {
        notFound();
    }

    const { product, categoryName } = productData;
    const rawAssets = await getProductAssets(id);
    const allProducts = await getAllProducts(); // For reassignment in AssetGrid

    // Transform assets to include the product object (required by AssetGrid)
    const assetList = rawAssets.map(a => ({
        ...a,
        product: product
    }));

    return (
        <div className="flex flex-col space-y-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
                        <Badge variant="outline" className="text-xs font-normal">
                            {assetList.length} Dosya
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{categoryName || "Genel"}</span>
                        <span>•</span>
                        <Badge variant={product.status === "published" ? "secondary" : "secondary"} className="h-5">
                            {product.status === "published" ? "Yayında" : "Taslak"}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <UploadCloud className="mr-2 h-4 w-4" /> Dosya Yükle
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Dosya Yükle</DialogTitle>
                                <DialogDescription>
                                    Bu klasöre yeni dosyalar ekleyin.
                                </DialogDescription>
                            </DialogHeader>
                            <AssetUploader productId={product.id} />
                        </DialogContent>
                    </Dialog>

                    <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Button variant="outline">Düzenle</Button>
                    </Link>
                    <DeleteProductButton productId={product.id} productName={product.name} />
                </div>
            </div>

            <Separator />

            {/* Assets Grid - reusing the Media Library component */}
            <div className="flex-1">
                {assetList.length > 0 ? (
                    <AssetGrid
                        initialData={assetList}
                        currentPage={1} // TODO: Implement pagination if list gets huge
                        totalPages={1}
                        products={allProducts}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg bg-muted/10">
                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Bu klasör henüz boş</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mt-2 mb-4">
                            Mevcut görselleri bu klasöre taşıyın veya yeni dosyalar yükleyin.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
