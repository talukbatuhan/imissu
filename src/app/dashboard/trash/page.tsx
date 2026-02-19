import { Suspense } from "react";
import { getDeletedAssets } from "@/app/actions/assets";
import { TrashGrid } from "@/components/trash-grid";
import { Separator } from "@/components/ui/separator";

export default async function TrashPage() {
    const deletedAssets = await getDeletedAssets();

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Geri Dönüşüm Kutusu</h2>
                    <p className="text-muted-foreground">
                        Silinen dosyaları geri yükleyin veya kalıcı olarak silin. ({deletedAssets.length} dosya)
                    </p>
                </div>
            </div>
            <Separator />
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <TrashGrid initialAssets={deletedAssets} />
            </Suspense>
        </div>
    );
}
