"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { saveNote, deleteImage } from "@/app/actions";
import { toast } from "sonner";
import { Loader2, Check, X, Expand, Trash2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ImageViewerModalProps {
    imageKey: string;
    initialNote: string;
    imageUrl: string;
    onClose?: () => void;
    // Navigation props would be great here but require passing the whole list or using URL params smartly
}

export function ImageViewerModal({ imageKey, initialNote, imageUrl }: ImageViewerModalProps) {
    const router = useRouter();
    const [content, setContent] = useState(initialNote);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);


    const isMounted = useRef(false);

    // Debounce Autosave
    useEffect(() => {
        if (content === initialNote && !isMounted.current) return;
        if (!isMounted.current) {
            isMounted.current = true;
            if (content === initialNote) return;
        }

        const timer = setTimeout(async () => {
            setIsSaving(true);
            try {
                await saveNote(imageKey, content);
                setLastSaved(new Date());
            } catch {
                toast.error("Failed to save note");
            } finally {
                setIsSaving(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [content, imageKey, initialNote]);

    const handleClose = () => {
        // Optimistic clean URL push
        router.back();
    };


    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                router.back();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                setIsSaving(true);
                saveNote(imageKey, content)
                    .then(() => {
                        setLastSaved(new Date());
                        toast.success("Note saved manually");
                    })
                    .catch(() => {
                        toast.error("Failed to save note");
                    })
                    .finally(() => {
                        setIsSaving(false);
                    });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [content, imageKey, router]);

    return (
        <Dialog defaultOpen={true} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-none shadow-2xl rounded-2xl md:grid md:grid-cols-[1fr_400px] md:h-[85vh] md:max-w-7xl">

                {/* Left/Top: Image Area */}
                <div className="relative flex-1 bg-black/5 dark:bg-black/40 flex items-center justify-center p-6 group overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full h-full"
                    >
                        <Image
                            src={imageUrl}
                            alt={imageKey}
                            fill
                            className="object-contain drop-shadow-2xl"
                            priority
                            sizes="(max-width: 768px) 100vw, 70vw"
                            unoptimized
                        />
                    </motion.div>

                    {/* Overlay Controls */}
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <div className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md text-xs font-mono border shadow-sm">
                            {imageKey}
                        </div>
                    </div>

                    {/* Bottom Action Bar for Image */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-background/80 backdrop-blur-md p-1.5 rounded-full border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                            onClick={() => {
                                navigator.clipboard.writeText(imageUrl);
                                toast.success("Image URL copied to clipboard");
                            }}
                            title="Copy Public Link"
                        >
                            <LinkIcon className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                            onClick={() => window.open(imageUrl, '_blank')}
                            title="Open in New Tab"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>

                        <div className="w-px h-5 bg-border self-center mx-1" />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={async () => {
                                if (confirm("Are you sure you want to delete this image? This cannot be undone.")) {
                                    const res = await deleteImage(imageKey);
                                    if (res.success) {
                                        toast.success("Image deleted");
                                        handleClose();
                                    } else {
                                        toast.error("Failed to delete image");
                                    }
                                }
                            }}
                            title="Delete Image"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-10 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-md md:hidden"
                        onClick={handleClose}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Right/Bottom: Note Area */}
                <div className="flex flex-col h-[40vh] md:h-full bg-background border-t md:border-t-0 md:border-l relative z-20 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.1)]">
                    {/* Note Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
                        <div className="flex flex-col">
                            <DialogTitle className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">Note Details</DialogTitle>
                            <span className="text-[10px] text-muted-foreground">
                                {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : "Unsaved changes"}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <AnimatePresence mode="wait">
                                {isSaving ? (
                                    <motion.div
                                        key="saving"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="text-primary"
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="saved"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-green-500"
                                    >
                                        <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-md">
                                            <Check className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">Saved</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button variant="ghost" size="icon" className="hidden md:flex ml-2 h-8 w-8" onClick={handleClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative group">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full resize-none border-0 focus-visible:ring-0 p-6 text-base leading-relaxed font-sans bg-transparent absolute inset-0 text-foreground selection:bg-primary/20"
                            placeholder="Write your observations here..."
                            autoFocus
                            spellCheck={false}
                        />
                        {/* Optional: Add a subtle overlay for ""Empty"" state if needed */}
                        {!content && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                                <Expand className="w-24 h-24" />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5">
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    Ctrl+S
                                </kbd>
                                to save
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    Esc
                                </kbd>
                                to close
                            </span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
