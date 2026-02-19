"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAsset } from "@/app/actions/assets";

interface DeleteAssetButtonProps {
    assetId: string;
    fileName?: string;
    variant?: "icon" | "button"; // 'icon' renders just the icon button, 'button' might render text
    className?: string; // Additional classes for positioning
}

export function DeleteAssetButton({ assetId, fileName, variant = "icon", className }: DeleteAssetButtonProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const onDelete = async () => {
        try {
            setLoading(true);
            const result = await deleteAsset(assetId);
            if (result.success) {
                toast.success("Dosya başarıyla silindi.");
                router.refresh();
            } else {
                toast.error("Dosya silinemedi.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    size="icon"
                    variant="destructive"
                    className={`h-8 w-8 ${className}`}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Dosyayı Sil</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu dosyayı silmek istediğinizden emin misiniz? {fileName && `("${fileName}")`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading}
                        onClick={(e) => { e.preventDefault(); onDelete(); }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? "Siliniyor..." : "Sil"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
