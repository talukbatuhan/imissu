
import { db } from "@/lib/db";
import { products, categories, assets } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Page() {
    const [productCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products);

    const [categoryCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(categories);

    const [assetCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(assets);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productCount?.count ?? 0}</div>
                        <p className="text-xs text-muted-foreground">katalogda</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{categoryCount?.count ?? 0}</div>
                        <p className="text-xs text-muted-foreground">aktif bölüm</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dijital Varlıklar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assetCount?.count ?? 0}</div>
                        <p className="text-xs text-muted-foreground">resimler ve belgeler</p>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Son Aktiviteler</h3>
                    <p className="text-sm text-muted-foreground">Yeni ürünler ve güncellemeler burada görünecektir.</p>
                </div>
                <div className="p-6 pt-0">
                    <div className="text-sm">Son aktivite yok.</div>
                </div>
            </div>
        </div>
    );
}
