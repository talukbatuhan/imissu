
"use client";

import { useTransition, useState } from "react";
import { linkLegacyFileToProduct } from "@/app/actions/legacy-migration";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LinkFileProps {
    fileName: string;
    products: { id: string; name: string }[];
}

export function LinkFileButton({ fileName, products }: LinkFileProps) {
    const [open, setOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleLink = () => {
        if (!selectedProductId) return;

        startTransition(async () => {
            try {
                await linkLegacyFileToProduct(selectedProductId, fileName);
                toast.success(`${fileName} seçilen ürüne bağlandı!`);
                setOpen(false);
                router.refresh();
            } catch (error) {
                toast.error("Dosya bağlanırken hata oluştu.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Ürüne Bağla
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dosya Bağla: "{fileName}"</DialogTitle>
                    <DialogDescription>
                        Bu eski dosyayı bağlamak istediğiniz ürünü seçin.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Select onValueChange={setSelectedProductId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Ürün seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
                    <Button onClick={handleLink} disabled={isPending || !selectedProductId}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Bağla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
