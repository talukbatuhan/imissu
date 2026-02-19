
import { ProductForm } from "@/components/products/product-form";
import { getCategoryOptions } from "@/app/actions/products";
import { Separator } from "@/components/ui/separator";

export default async function NewProductPage() {
    const categories = await getCategoryOptions();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Ürün Oluştur</h3>
                <p className="text-sm text-muted-foreground">
                    Kataloğa yeni bir ürün eklemek için detayları doldurun.
                </p>
            </div>
            <Separator />
            <ProductForm categories={categories} />
        </div>
    );
}
