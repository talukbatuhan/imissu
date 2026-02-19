"use client";

import { useState } from "react";
import { AssetWithProduct, restoreAsset, permanentDeleteAsset } from "@/app/actions/assets";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Check, CheckCircle2, RotateCcw, Trash, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface TrashGridProps {
    initialAssets: AssetWithProduct[];
}

export function TrashGrid({ initialAssets }: TrashGridProps) {
    const [assets, setAssets] = useState<AssetWithProduct[]>(initialAssets);
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedAssetIds(new Set());
    };

    const handleAssetClick = (asset: AssetWithProduct) => {
        if (isSelectionMode) {
            const newSelected = new Set(selectedAssetIds);
            if (newSelected.has(asset.id)) {
                newSelected.delete(asset.id);
            } else {
                newSelected.add(asset.id);
            }
            setSelectedAssetIds(newSelected);
        }
    };

    const handleSelectAll = () => {
        if (selectedAssetIds.size === assets.length) {
            setSelectedAssetIds(new Set());
        } else {
            const allIds = new Set(assets.map(a => a.id));
            setSelectedAssetIds(allIds);
        }
    };

    const handleRestore = async (ids?: string[]) => {
        const targetIds = ids || Array.from(selectedAssetIds);
        if (!targetIds.length) return;

        setIsRestoring(true);
        try {
            setAssets(prev => prev.filter(a => !targetIds.includes(a.id)));
            const result = await restoreAsset(targetIds);
            if (result.success) {
                toast.success(`${targetIds.length} dosya geri yüklendi.`);
                setSelectedAssetIds(new Set());
                router.refresh();
            } else {
                toast.error("Geri yükleme başarısız.");
                router.refresh();
            }
        } catch (error) {
            toast.error("Hata oluştu.");
        } finally {
            setIsRestoring(false);
        }
    };

    const handlePermanentDelete = async (ids?: string[]) => {
        const targetIds = ids || Array.from(selectedAssetIds);
        if (!targetIds.length) return;

        if (!confirm("Bu dosyalar KALICI OLARAK silinecek. Emin misiniz?")) return;

        setIsDeleting(true);
        try {
            setAssets(prev => prev.filter(a => !targetIds.includes(a.id)));
            const result = await permanentDeleteAsset(targetIds);
            if (result.success) {
                toast.success(`${targetIds.length} dosya kalıcı olarak silindi.`);
                setSelectedAssetIds(new Set());
                router.refresh();
            } else {
                toast.error("Silme başarısız.");
                router.refresh();
            }
        } catch (error) {
            toast.error("Hata oluştu.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <Trash className="w-12 h-12 mb-4 opacity-20" />
                <p>Geri dönüşüm kutusu boş.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border">
                <div className="flex items-center gap-4">
                    <Button
                        variant={isSelectionMode ? "secondary" : "default"}
                        onClick={toggleSelectionMode}
                        className={cn(
                            "transition-all",
                            isSelectionMode ? "bg-muted-foreground/20 hover:bg-muted-foreground/30 text-foreground" : ""
                        )}
                    >
                        {isSelectionMode ? (
                            <>
                                <X className="mr-2 h-4 w-4" /> İptal
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Seçim Yap
                            </>
                        )}
                    </Button>

                    {isSelectionMode && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <span className="text-sm font-medium text-muted-foreground px-2 border-l border-r mx-2">
                                {selectedAssetIds.size} seçildi
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                                {selectedAssetIds.size === assets.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {assets.map((asset) => {
                    const isSelected = selectedAssetIds.has(asset.id);

                    return (
                        <ContextMenu key={asset.id}>
                            <ContextMenuTrigger>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={cn(
                                        "group relative aspect-square rounded-xl overflow-hidden border bg-background shadow-sm transition-all cursor-pointer hover:shadow-md",
                                        isSelected && "ring-2 ring-primary border-primary ring-offset-2",
                                        isSelectionMode && !isSelected && "hover:border-primary/50"
                                    )}
                                    onClick={() => handleAssetClick(asset)}
                                >
                                    <div className="absolute inset-0 bg-muted/10" />
                                    <img
                                        src={asset.fileUrl}
                                        alt={asset.fileName}
                                        className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-300"
                                    />

                                    {/* Selection Overlay */}
                                    {isSelectionMode && (
                                        <div className={cn(
                                            "absolute top-2 left-2 z-10 transition-all duration-200",
                                            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}>
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background",
                                                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"
                                            )}>
                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs truncate">{asset.fileName}</p>
                                    </div>
                                </motion.div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem onClick={() => handleRestore([asset.id])}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Geri Yükle
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handlePermanentDelete([asset.id])} className="text-destructive focus:text-destructive">
                                    <Trash className="mr-2 h-4 w-4" /> Kalıcı Olarak Sil
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    );
                })}
            </div>

            {/* Floating Action Bar */}
            <AnimatePresence>
                {isSelectionMode && selectedAssetIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-foreground text-background rounded-full shadow-2xl border border-white/10"
                    >
                        <div className="pl-4 pr-2 font-medium text-sm">
                            {selectedAssetIds.size} öğe
                        </div>

                        <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full hover:bg-white/20 hover:text-white"
                            onClick={() => handleRestore()}
                            disabled={isRestoring}
                        >
                            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                            Geri Yükle
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full hover:bg-red-500/20 hover:text-red-400 text-red-400"
                            onClick={() => handlePermanentDelete()}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
                            Kalıcı Sil
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
