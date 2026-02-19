
"use client";

import { useState, useEffect, useCallback } from "react";
import { AssetWithProduct } from "@/app/actions/assets";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Link as LinkIcon, Trash, Check, ChevronsUpDown, Loader2, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { updateAssetNote } from "@/app/actions/assets";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { X } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";

interface AssetDetailModalProps {
    asset: AssetWithProduct;
    allAssets: AssetWithProduct[];
    isOpen: boolean;
    onClose: () => void;
    onDelete: (id: string, fileName?: string) => Promise<void>;
    onAssign?: (assetId: string, productId: string) => Promise<void>;
    products?: { id: string; name: string }[];
}

export function AssetDetailModal({
    asset,
    allAssets,
    isOpen,
    onClose,
    onDelete,
    onAssign,
    products = []
}: AssetDetailModalProps) {
    const [currentAsset, setCurrentAsset] = useState<AssetWithProduct>(asset);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [notes, setNotes] = useState(asset.notes || "");
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // Update currentAsset when prop changes (for external control) or internal navigation
    useEffect(() => {
        if (asset && isOpen) {
            setCurrentAsset(asset);
        }
    }, [asset, isOpen]);

    // Update notes when currentAsset changes
    useEffect(() => {
        setNotes(currentAsset.notes || "");
    }, [currentAsset]);

    const currentIndex = allAssets.findIndex(a => a.id === currentAsset.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < allAssets.length - 1;

    const navigate = useCallback((direction: 'prev' | 'next') => {
        const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex >= 0 && newIndex < allAssets.length) {
            setCurrentAsset(allAssets[newIndex]);
            setSelectedProductId(""); // Reset selection on navigate
        }
    }, [currentIndex, allAssets]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        // Don't navigate if interacting with inputs (like search)
        if (document.activeElement?.tagName === 'INPUT') return;

        if (e.key === "ArrowLeft") navigate("prev");
        if (e.key === "ArrowRight") navigate("next");
    }, [isOpen, navigate]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen || !currentAsset) return null;

    const copyLink = () => {
        navigator.clipboard.writeText(currentAsset.fileUrl);
        toast.success("Link kopyalandı!");
    };

    const handleAssignClick = async () => {
        if (!onAssign || !selectedProductId) return;
        setAssigning(true);
        try {
            await onAssign(currentAsset.id, selectedProductId);
            // onAssign is expected to close modal or refresh, but if we stay:
            setSelectedProductId("");
            setOpenCombobox(false);
        } catch (_) {
            toast.error("Atama sırasında hata oluştu");
        } finally {
            setAssigning(false);
        }
    };

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            const result = await updateAssetNote(currentAsset.id, notes);
            if (result.success) {
                toast.success("Not kaydedildi");
                setCurrentAsset(prev => ({ ...prev, notes }));
            } else {
                toast.error("Not kaydedilemedi");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSavingNotes(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-[95vw] h-[95vh] p-0 flex flex-col md:flex-row gap-0 overflow-hidden" showCloseButton={false}>
                <div className="absolute right-4 top-4 z-50 md:hidden">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/20 text-white hover:bg-black/40">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Left: Image Canvas */}
                <div className="flex-1 bg-black/95 relative flex items-center justify-center min-h-[50vh]">
                    {/* Navigation Buttons */}
                    {hasPrevious && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 z-10 text-white/70 hover:text-white hover:bg-black/50 rounded-full h-12 w-12"
                            onClick={() => navigate("prev")}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                    )}
                    {hasNext && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 z-10 text-white/70 hover:text-white hover:bg-black/50 rounded-full h-12 w-12"
                            onClick={() => navigate("next")}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    )}

                    {/* Using standard img for layout fidelity in simpler scenarios, or could use Next Image */}
                    <img
                        src={currentAsset.fileUrl}
                        alt={currentAsset.fileName}
                        className="max-h-[85vh] max-w-full object-contain"
                    />

                    {/* Notes Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-md p-4 border-t border-white/10 transition-all hover:bg-black/70">
                        <div className="max-w-3xl mx-auto space-y-2">
                            <div className="flex items-center justify-between text-white/90">
                                <Label className="text-xs font-medium uppercase tracking-wider text-white/70">Görsel Notları</Label>
                                {notes !== (currentAsset.notes || "") && (
                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded-full">Değişiklikler var</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="Bu görsele not ekleyin..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[40px] h-12 py-2 resize-none bg-black/40 border-white/20 text-white placeholder:text-white/40 focus:bg-black/60 focus:border-white/40 mb-1"
                                />
                                <Button
                                    onClick={handleSaveNotes}
                                    disabled={isSavingNotes || notes === (currentAsset.notes || "")}
                                    size="icon"
                                    className={cn(
                                        "h-12 w-12 shrink-0 transition-all",
                                        notes === (currentAsset.notes || "")
                                            ? "bg-white/10 text-white/50 hover:bg-white/20"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                >
                                    {isSavingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                        notes === (currentAsset.notes || "") ? <Check className="w-4 h-4" /> :
                                            <ArrowUp className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar / Metadata */}
                <div className="w-full md:w-96 bg-background border-l flex flex-col h-full shrink-0 relative z-20">
                    <div className="absolute right-2 top-2 hidden md:block">
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle className="truncate pr-8" title={currentAsset.fileName}>
                            {currentAsset.fileName}
                        </DialogTitle>
                        <div className="text-xs text-muted-foreground uppercase mt-1">
                            {currentAsset.fileType} • {currentAsset.width ? `${currentAsset.width}x${currentAsset.height}` : 'Boyut Bilinmiyor'}
                        </div>
                    </DialogHeader>

                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={copyLink}>
                                <Copy className="mr-2 h-4 w-4" /> Link
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.open(currentAsset.fileUrl, '_blank')}>
                                <LinkIcon className="mr-2 h-4 w-4" /> Aç
                            </Button>
                        </div>

                        <Separator />

                        {/* Current Assignment / Assign Product */}
                        {currentAsset.product ? (
                            <div className="space-y-4">
                                <Label>Atanan Ürün</Label>
                                <div className="p-3 bg-muted rounded-md space-y-2">
                                    <div className="font-medium text-sm">{currentAsset.product.name}</div>
                                    {currentAsset.product.description && (
                                        <div className="text-xs text-muted-foreground">{currentAsset.product.description}</div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-8 mt-2"
                                        onClick={() => {
                                            // Reset assignment to allow re-assigning (or unassigning which is technically assigning to null if supported, 
                                            // but for now maybe just allow changing)
                                            // Ideally we should have an 'Unassign' button or just show the combobox to change it.
                                            // Let's show the combobox if they want to change it.
                                            // Or easier: just show the combobox below always?
                                            // Let's keep it simple: Show current info, and a 'Change' button that opens the combobox logic.
                                            // Actually, the user asked to see the notes.
                                            // Just showing the combobox below "Assigned Product" might be confusing if it says "Select Product".
                                            // Let's just render the combobox below this info block if they want to change it.
                                        }}
                                    >
                                        Ürün Sayfasına Git
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground text-center">- veya değiştir istiyorsanız aşağıdan seçin -</div>
                            </div>
                        ) : null}

                        <div className="space-y-4">
                            <Label>{currentAsset.product ? "Ürünü Değiştir" : "Ürüne Ata"}</Label>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className="w-full justify-between"
                                    >
                                        {selectedProductId
                                            ? products.find((product) => product.id === selectedProductId)?.name
                                            : "Ürün seçin..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Ürün ara..." />
                                        <CommandList>
                                            <CommandEmpty>Ürün bulunamadı.</CommandEmpty>
                                            <CommandGroup>
                                                {products.map((product) => (
                                                    <CommandItem
                                                        key={product.id}
                                                        value={product.name}
                                                        onSelect={() => {
                                                            setSelectedProductId(product.id === selectedProductId ? "" : product.id)
                                                            setOpenCombobox(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {product.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            <Button
                                className="w-full"
                                disabled={!selectedProductId || assigning}
                                onClick={handleAssignClick}
                            >
                                {assigning ? "Atanıyor..." : "Seç ve Ata"}
                            </Button>
                        </div>

                        <Separator />

                        {/* Metadata */}
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Yüklenme Tarihi</span>
                                <span>{currentAsset.uploadedAt ? new Date(currentAsset.uploadedAt).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Boyut</span>
                                <span>-</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t mt-auto">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => {
                                if (confirm("Bu dosyayı kalıcı olarak silmek istediğinize emin misiniz?")) {
                                    onDelete(currentAsset.id, currentAsset.fileName);
                                    onClose();
                                }
                            }}
                        >
                            <Trash className="mr-2 h-4 w-4" /> Dosyayı Sil
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
