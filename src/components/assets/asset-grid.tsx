
"use client";

import { useState, useEffect } from "react";
import { AssetWithProduct, bulkDeleteAssets, bulkAssignAssets, deleteAsset } from "@/app/actions/assets";
import { createFolder } from "@/app/actions/folder-actions";
import { cn } from "@/lib/utils";
import { AssetDetailModal } from "./asset-detail-modal";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { CheckCircle2, Copy, Eye, Trash, MousePointer2, X, FolderInput, Loader2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { assignAssetToProduct } from "@/app/actions/unassigned-assets";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AssetGridProps {
    initialData: AssetWithProduct[];
    currentPage: number;
    totalPages: number;
    products: { id: string; name: string }[];
}

export function AssetGrid({ initialData, currentPage, totalPages, products }: AssetGridProps) {
    const [assets, setAssets] = useState<AssetWithProduct[]>(initialData);
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [previewAsset, setPreviewAsset] = useState<AssetWithProduct | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkAssigning, setIsBulkAssigning] = useState(false);
    const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
    const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setAssets(initialData);
        setSelectedAssetIds(new Set()); // Reset selection on page change
    }, [initialData]);

    // Cleanup selection when exiting selection mode
    useEffect(() => {
        if (!isSelectionMode) {
            setSelectedAssetIds(new Set());
        }
    }, [isSelectionMode]);

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
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
        } else {
            setPreviewAsset(asset);
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

    const handleBulkDelete = async () => {
        if (!confirm(`${selectedAssetIds.size} dosyayı silmek istediğinize emin misiniz?`)) return;

        setIsBulkDeleting(true);
        try {
            const ids = Array.from(selectedAssetIds);
            // Optimistic update
            setAssets(prev => prev.filter(a => !selectedAssetIds.has(a.id)));

            const result = await bulkDeleteAssets(ids);

            if (result.success) {
                toast.success(`${ids.length} dosya silindi.`);
                setSelectedAssetIds(new Set());
                setIsSelectionMode(false);
                router.refresh();
            } else {
                toast.error("Silme işlemi başarısız.");
                router.refresh(); // Revert
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleBulkAssign = async (productId: string) => {
        setIsBulkAssigning(true);
        try {
            const ids = Array.from(selectedAssetIds);
            // Optimistic update - although difficult to show visually without refresh
            const result = await bulkAssignAssets(ids, productId);

            if (result.success) {
                toast.success(`${ids.length} dosya ürüne atandı.`);
                setSelectedAssetIds(new Set());
                setIsSelectionMode(false);
                setShowBulkAssignDialog(false);
                router.refresh();
            } else {
                toast.error("Atama işlemi başarısız.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsBulkAssigning(false);
        }
    };

    // Single item actions (passed to modal or context menu)
    const handleSingleDelete = async (id: string) => {
        setAssets(prev => prev.filter(a => a.id !== id));
        const result = await deleteAsset(id);
        if (!result.success) {
            toast.error("Silinemedi.");
            router.refresh();
        } else {
            toast.success("Dosya silindi.");
        }
    };

    const handleSingleAssign = async (assetId: string, productId: string) => {
        // Optimistic update
        setPreviewAsset(null);
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, productId } : a)); // Just update local state ideally if we had full product object

        const result = await assignAssetToProduct(assetId, productId);
        if (result.success) {
            toast.success("Dosya atandı.");
            router.refresh();
        } else {
            toast.error("Atama başarısız.");
        }
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("Link kopyalandı!");
    };

    const handleCreateFolder = async () => {
        if (!folderName.trim()) return;
        setIsCreatingFolder(true);
        try {
            const result = await createFolder(folderName);
            if (result.success) {
                toast.success("Klasör oluşturuldu");
                setShowCreateFolderDialog(false);
                setFolderName("");
                router.refresh();
            } else {
                toast.error("Klasör oluşturulamadı");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setIsCreatingFolder(false);
        }
    };

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
                                <MousePointer2 className="mr-2 h-4 w-4" /> Seçim Yap
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

                    <Button
                        variant="outline"
                        onClick={() => setShowCreateFolderDialog(true)}
                        className=""
                    >
                        <FolderPlus className="mr-2 h-4 w-4" /> Klasör Oluştur
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Additional toolbar items if needed */}
                </div>
            </div>

            {/* Grid */}
            <div className={cn(
                "grid gap-6 transition-all",
                // Larger items: fewer columns
                "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            )}>
                {assets.map((asset) => {
                    const isSelected = selectedAssetIds.has(asset.id);

                    return (
                        <ContextMenu key={asset.id}>
                            <ContextMenuTrigger>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "group relative aspect-[4/3] rounded-xl overflow-hidden border bg-background shadow-sm transition-all cursor-pointer hover:shadow-md",
                                        isSelected && "ring-2 ring-primary border-primary ring-offset-2",
                                        isSelectionMode && !isSelected && "hover:border-primary/50"
                                    )}
                                    onClick={() => handleAssetClick(asset)}
                                >
                                    {/* Image */}
                                    <div className="absolute inset-0 bg-muted/10" />
                                    <img
                                        src={asset.fileUrl}
                                        alt={asset.fileName}
                                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
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

                                    {/* Info Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-white text-sm font-medium truncate">{asset.fileName}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-white/70 text-[10px] uppercase tracking-wider">{asset.fileType}</p>
                                            {asset.product && (
                                                <Badge variant="outline" className="text-[10px] h-5 bg-black/40 border-white/20 text-white hover:bg-black/60">
                                                    {asset.product.name}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Note Indicator */}
                                    {asset.notes && (
                                        <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                                        </div>
                                    )}

                                </motion.div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem onClick={() => setPreviewAsset(asset)}>
                                    <Eye className="mr-2 h-4 w-4" /> Görüntüle / Düzenle
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => copyLink(asset.fileUrl)}>
                                    <Copy className="mr-2 h-4 w-4" /> Link Kopyala
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleSingleDelete(asset.id)} className="text-destructive focus:text-destructive">
                                    <Trash className="mr-2 h-4 w-4" /> Sil
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    );
                })}
            </div>

            {/* Floating Action Bar for Selection Mode */}
            <AnimatePresence>
                {isSelectionMode && selectedAssetIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-foreground text-background rounded-full shadow-2xl border border-white/10"
                    >
                        <div className="pl-4 pr-2 font-medium text-sm">
                            {selectedAssetIds.size} öğe seçildi
                        </div>
                        <div className="h-4 w-px bg-white/20 mx-1" />

                        <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full hover:bg-white/20 hover:text-white"
                            onClick={() => setShowBulkAssignDialog(true)}
                            disabled={isBulkAssigning}
                        >
                            <FolderInput className="w-4 h-4 mr-2" />
                            Ürüne Ata / Klasörle
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full hover:bg-red-500/20 hover:text-red-400 text-red-400"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                        >
                            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
                            Sil
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full h-8 w-8 ml-1 hover:bg-white/20"
                            onClick={() => setSelectedAssetIds(new Set())}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Asset Detail Modal */}
            {previewAsset && (
                <AssetDetailModal
                    asset={previewAsset}
                    allAssets={assets}
                    isOpen={!!previewAsset}
                    onClose={() => setPreviewAsset(null)}
                    onDelete={async (id) => {
                        await handleSingleDelete(id);
                        setPreviewAsset(null);
                    }}
                    products={products}
                    onAssign={handleSingleAssign}
                    onNavigate={setPreviewAsset}
                />
            )}

            {/* Bulk Assign Dialog */}
            <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Toplu Atama</DialogTitle>
                        <DialogDescription>
                            Seçili {selectedAssetIds.size} dosyayı bir ürüne atayın (klasörleyin).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Command className="rounded-lg border shadow-md">
                            <CommandInput placeholder="Ürün ara..." />
                            <CommandList className="max-h-[300px]">
                                <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                                <CommandGroup heading="Ürünler">
                                    {products.map((product) => (
                                        <CommandItem
                                            key={product.id}
                                            onSelect={() => handleBulkAssign(product.id)}
                                            className="cursor-pointer"
                                        >
                                            <span>{product.name}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Folder Dialog */}
            <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Klasör Oluştur</DialogTitle>
                        <DialogDescription>
                            Yeni bir klasör (ürün) oluşturun.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Klasör Adı</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="Örn: Yaz Sezonu Çekimleri"
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleCreateFolder}
                            disabled={!folderName.trim() || isCreatingFolder}
                        >
                            {isCreatingFolder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Oluştur
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
