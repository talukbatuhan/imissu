"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Loader2, Copy, FileEdit, Trash, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteProduct } from "@/app/actions/products";

interface ProductActionsProps {
    product: {
        id: string;
        name: string;
        sku: string;
    };
}

export function ProductActions({ product }: ProductActionsProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("Ürün ID'si kopyalandı.");
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            const result = await deleteProduct(product.id);
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. "{product.name}" ürünü ve bağlı tüm veriler silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
                        <AlertDialogAction disabled={loading} onClick={(e) => { e.preventDefault(); onDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Menüyü aç</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onCopy(product.id)}>
                        <Copy className="mr-2 h-4 w-4" /> ID Kopyala
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Link href={`/dashboard/products/${product.id}`}>
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> Detayları Gör
                        </DropdownMenuItem>
                    </Link>
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                        <DropdownMenuItem>
                            <FileEdit className="mr-2 h-4 w-4" /> Düzenle
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setOpen(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash className="mr-2 h-4 w-4" /> Sil
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
