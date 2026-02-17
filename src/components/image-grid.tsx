"use client";

import { useState } from "react";
import { ImageCard } from "./image-card";
import { SearchInput } from "./search-input";
import { Button } from "./ui/button";
import { Check, Copy, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteImages } from "@/app/actions";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { getImageUrl } from "@/lib/supabase";

interface ImageGridProps {
    images: string[];
    notedImages: Set<string>;
    query: string;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    selectedImage: string | undefined;
}

export function ImageGrid({
    images,
    notedImages,
    query,
    currentPage,
    totalPages,
    totalItems,
    selectedImage,
}: ImageGridProps) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleSelection = (img: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(img)) {
            newSet.delete(img);
        } else {
            newSet.add(img);
        }
        setSelectedItems(newSet);
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedItems(new Set());
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedItems.size} images? This cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            const keys = Array.from(selectedItems);
            const res = await deleteImages(keys);
            if (res.success) {
                toast.success(`${keys.length} images deleted`);
                setSelectedItems(new Set());
                setIsSelectionMode(false);
            } else {
                toast.error("Failed to delete images");
            }
        } catch {
            toast.error("Failed to delete images");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkCopy = () => {
        const links = Array.from(selectedItems).map(key => getImageUrl(key)).join("\n");
        navigator.clipboard.writeText(links);
        toast.success(`${selectedItems.size} links copied to clipboard`);
        setSelectedItems(new Set());
        setIsSelectionMode(false);
    };

    return (
        <main className="container mx-auto p-4 min-h-screen pb-32 flex flex-col relative">
            <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 bg-background/95 backdrop-blur z-20 py-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
                    <div className="text-sm text-muted-foreground">
                        {totalItems} items • {notedImages.size} notes
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={isSelectionMode ? "secondary" : "outline"}
                        onClick={toggleSelectionMode}
                        className="transition-all"
                    >
                        {isSelectionMode ? "Cancel Selection" : "Select Images"}
                    </Button>
                    <SearchInput />
                </div>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 flex-1 content-start">
                {images.map((img) => {
                    const hasNote = notedImages.has(img);
                    const src = getImageUrl(img);
                    const isSelected = selectedItems.has(img);

                    return (
                        <div key={img} className="relative group">
                            <ImageCard
                                img={img}
                                src={src}
                                hasNote={!!hasNote}
                                isSelected={selectedImage === img}
                                query={query}
                                page={currentPage}
                            />

                            {/* Selection Overlay */}
                            {(isSelectionMode || isSelected) && (
                                <div
                                    className="absolute inset-0 z-20 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleSelection(img);
                                    }}
                                >
                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all ${isSelected ? "bg-primary border-primary" : "bg-black/30 hover:bg-black/50"}`}>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div className={`absolute inset-0 border-2 rounded-lg pointer-events-none transition-all ${isSelected ? "border-primary bg-primary/10" : "border-transparent"}`} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {images.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    {query ? `No images found for "${query}"` : "No images found."}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        asChild
                    >
                        <Link href={`/?page=${currentPage - 1}${query ? `&q=${query}` : ''}`}>Previous</Link>
                    </Button>

                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        asChild
                    >
                        <Link href={`/?page=${currentPage + 1}${query ? `&q=${query}` : ''}`}>Next</Link>
                    </Button>
                </div>
            )}

            {/* Floating Action Bar */}
            <AnimatePresence>
                {isSelectionMode && selectedItems.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6"
                    >
                        <span className="text-sm font-medium pl-2">
                            {selectedItems.size} selected
                        </span>

                        <div className="h-4 w-px bg-background/20" />

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="hover:bg-background/20 hover:text-background h-8 px-2"
                                onClick={handleBulkCopy}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Links
                            </Button>

                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 px-3"
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full h-6 w-6 hover:bg-background/20 hover:text-background -mr-2"
                            onClick={() => setSelectedItems(new Set())}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
