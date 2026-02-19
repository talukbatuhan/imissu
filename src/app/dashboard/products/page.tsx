
import { getProducts } from "@/app/actions/products";
import { SearchInput } from "@/components/search-input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ProductActions } from "@/components/products/product-actions";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>;
}) {
    const { search } = await searchParams;
    const products = await getProducts({ search });

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ürünler</h2>
                    <p className="text-muted-foreground">
                        Ürün envanterinizi ve özelliklerini yönetin.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <SearchInput placeholder="İsim ile ara..." />
                    <Link href="/dashboard/products/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Yeni Ürün
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Durum</TableHead>
                            <TableHead>Ürün Adı</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Ürün bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Badge variant={product.status === "published" ? "default" : "secondary"}>
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.categoryName || "Kategorisiz"}</TableCell>
                                    <TableCell className="text-right">
                                        <ProductActions product={product} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
