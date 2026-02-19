
import { db } from "@/lib/db";
import { products, assets, categories } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AssetUploader } from "@/components/assets/asset-uploader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { DeleteAssetButton } from "@/components/assets/delete-asset-button";
import { DeleteProductButton } from "@/components/products/delete-product-button";


interface ProductPageProps {
    params: Promise<{ id: string }>;
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
        .where(eq(assets.productId, productId))
        .orderBy(desc(assets.uploadedAt));
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
    const { id } = await params;
    const productData = await getProduct(id);

    if (!productData) {
        notFound();
    }

    const { product, categoryName } = productData;
    const productAssets = await getProductAssets(id);

    const images = productAssets.filter((a) => a.fileType === "image");
    const documents = productAssets.filter((a) => a.fileType === "document");

    return (
        <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{product.sku}</Badge>
                        <span>•</span>
                        <span>{categoryName || "Kategorisiz"}</span>
                        <span>•</span>
                        <Badge variant={product.status === "published" ? "default" : "secondary"}>
                            {product.status === "published" ? "Yayında" : "Taslak"}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DeleteProductButton productId={product.id} productName={product.name} />
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Button variant="outline">Ürünü Düzenle</Button>
                    </Link>
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="assets">Dosyalar ({productAssets.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Açıklama</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {product.description || "Açıklama girilmemiş."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Boyutlar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{product.dimensions || "Belirtilmemiş"}</p>
                            </CardContent>
                        </Card>

                        <Card className="col-span-full md:col-span-2 lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Özellikler</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(product.specifications as { key: string, value: string }[]).map((spec, idx) => (
                                            <div key={idx} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                                                <span className="font-medium text-sm">{spec.key}</span>
                                                <span className="text-sm text-muted-foreground">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Özellik tanımlanmamış.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="assets" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dosya Yükle</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Bu ürüne dosya eklemek için resim veya PDF dosyalarını sürükleyip bırakın.
                            </p>
                            <AssetUploader productId={product.id} />
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Images Gallery */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Resimler ({images.length})</h3>
                            {images.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic">Resim yüklenmemiş.</div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {images.map((img) => (
                                        <div key={img.id} className="group relative aspect-square rounded-md border overflow-hidden bg-muted">
                                            <Image
                                                src={img.fileUrl}
                                                alt={img.fileName}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <DeleteAssetButton assetId={img.id} fileName={img.fileName} />
                                                <Link href={img.fileUrl} target="_blank">
                                                    <Button size="icon" variant="secondary" className="h-8 w-8">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Documents List */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Belgeler ({documents.length})</h3>
                            {documents.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic">Belge yüklenmemiş.</div>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="flex items-center justify-center w-10 h-10 rounded bg-primary/10 text-primary shrink-0">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                                                    <p className="text-xs text-muted-foreground">PDF Document</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link href={doc.fileUrl} target="_blank">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteAssetButton assetId={doc.id} fileName={doc.fileName} variant="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
