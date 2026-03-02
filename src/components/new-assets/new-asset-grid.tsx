"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Copy, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface NewAsset {
    fileName: string;
    url: string;
}

interface NewAssetGridProps {
    initialData: NewAsset[];
}

export function NewAssetGrid({ initialData }: NewAssetGridProps) {
    const [previewAsset, setPreviewAsset] = useState<NewAsset | null>(null);

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("Link kopyalandı!");
    };

    return (
        <div className="space-y-6">
            {/* Grid */}
            <div className={cn(
                "grid gap-6 transition-all",
                "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            )}>
                {initialData.map((asset) => (
                    <ContextMenu key={asset.fileName}>
                        <ContextMenuTrigger>
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative aspect-[4/3] rounded-xl overflow-hidden border bg-background shadow-sm transition-all cursor-pointer hover:shadow-md"
                                onClick={() => setPreviewAsset(asset)}
                            >
                                {/* Image */}
                                <div className="absolute inset-0 bg-muted/10" />
                                <img
                                    src={asset.url}
                                    alt={asset.fileName}
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />

                                {/* Info Overlay */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white text-sm font-medium truncate">{asset.fileName}</p>
                                </div>
                            </motion.div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => setPreviewAsset(asset)}>
                                <Eye className="mr-2 h-4 w-4" /> Görüntüle
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => copyLink(asset.url)}>
                                <Copy className="mr-2 h-4 w-4" /> Link Kopyala
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                ))}
            </div>

            {/* Preview Modal */}
            <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <VisuallyHidden>
                        <DialogTitle>Önizleme: {previewAsset?.fileName}</DialogTitle>
                    </VisuallyHidden>
                    <div className="relative w-full h-full flex items-center justify-center">
                        {previewAsset && (
                            <img
                                src={previewAsset.url}
                                alt={previewAsset.fileName}
                                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                            />
                        )}
                        <Button
                            className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
                            size="icon"
                            onClick={() => setPreviewAsset(null)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
