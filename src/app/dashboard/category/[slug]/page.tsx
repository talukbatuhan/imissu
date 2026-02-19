
import { getCategoryBySlug } from "@/lib/data";
import { getProducts } from "@/app/actions/products";
import { notFound } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/products/product-actions";

interface CategoryPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);

    if (!category) {
        notFound();
    }

    const products = await getProducts({ categoryId: category.id });

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
                    <p className="text-muted-foreground">
                        Bu kategorideki ürünler listeleniyor.
                    </p>
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
                                    Bu kategoride ürün bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Badge variant={product.status === "published" ? "default" : "secondary"}>
                                            {product.status === "published" ? "Yayında" :
                                                product.status === "draft" ? "Taslak" : product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.categoryName || category.name}</TableCell>
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
