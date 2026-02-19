
import { getAssets } from "@/app/actions/assets";
import { AssetGrid } from "@/components/assets/asset-grid";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchInput } from "@/components/search-input";

export default async function AssetsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string }>;
}) {
    const { page, q: query } = await searchParams;
    const currentPage = Number(page) || 1;
    const pageSize = 60;
    const searchQuery = query || "";

    const result = await getAssets(currentPage, pageSize, searchQuery);

    // Fetch products for assignment combobox
    const productList = await db.select({
        id: products.id,
        name: products.name
    }).from(products).orderBy(desc(products.updatedAt));

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Medya Kütüphanesi</h2>
                    <p className="text-muted-foreground">
                        Tüm medya dosyalarını yönetin. ({result.totalCount} dosya)
                    </p>
                </div>
                <div>
                    <SearchInput placeholder="Dosya adı ara..." />
                </div>
            </div>
            <Separator />

            <div className="flex-1">
                <AssetGrid
                    initialData={result.data}
                    currentPage={currentPage}
                    totalPages={result.totalPages}
                    products={productList}
                />
            </div>

            {result.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        asChild={currentPage > 1}
                    >
                        {currentPage > 1 ? (
                            <Link href={`/dashboard/assets?page=${currentPage - 1}${searchQuery ? `&q=${searchQuery}` : ""}`}>
                                Önceki
                            </Link>
                        ) : (
                            <span>Önceki</span>
                        )}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Sayfa {currentPage} / {result.totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= result.totalPages}
                        asChild={currentPage < result.totalPages}
                    >
                        {currentPage < result.totalPages ? (
                            <Link href={`/dashboard/assets?page=${currentPage + 1}${searchQuery ? `&q=${searchQuery}` : ""}`}>
                                Sonraki
                            </Link>
                        ) : (
                            <span>Sonraki</span>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
