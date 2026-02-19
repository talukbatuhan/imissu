
import { getUnlinkedFiles } from "@/app/actions/legacy-migration";
import { LinkFileButton } from "@/components/legacy/link-file-button";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function LegacyFilesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const { page } = await searchParams;
    const currentPage = Number(page) || 1;
    const pageSize = 24;

    const result = await getUnlinkedFiles(currentPage, pageSize);

    const allProducts = await db.select({ id: products.id, name: products.name }).from(products);

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Atanmamış Eski Dosyalar</h1>
                    <p className="text-muted-foreground">
                        Eski galerinizden {result.total} adet sahipsiz dosya bulundu. Bunları yeni ürünlere bağlayabilirsiniz.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {result.files.map((file) => (
                    <Card key={file.fileName} className="overflow-hidden group">
                        <div className="relative aspect-square bg-muted">
                            {/* Using img for raw storage URLs */}
                            <img
                                src={file.url}
                                alt={file.fileName}
                                className="object-cover w-full h-full"
                                loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs truncate">
                                {file.fileName}
                            </div>
                        </div>
                        <CardContent className="p-2">
                            <LinkFileButton fileName={file.fileName} products={allProducts} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
                <Link href={`/dashboard/files?page=${Math.max(1, currentPage - 1)}`}>
                    <Button variant="outline" size="icon" disabled={currentPage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <span className="text-sm">
                    Sayfa {currentPage} / {result.totalPages}
                </span>
                <Link href={`/dashboard/files?page=${Math.min(result.totalPages, currentPage + 1)}`}>
                    <Button variant="outline" size="icon" disabled={currentPage >= result.totalPages}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
