
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { createAssetRecord } from "@/app/actions/assets";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Initialize Supabase client for storage upload
// Ideally use a specialized hook or context, but inline is fine for this component
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AssetUploaderProps {
    productId: string;
    onUploadComplete?: () => void;
}

export function AssetUploader({ productId, onUploadComplete }: AssetUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        let successCount = 0;

        for (const file of acceptedFiles) {
            try {
                const fileExt = file.name.split(".").pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `products/${productId}/${fileName}`;

                // 1. Upload to Supabase Storage
                const { error: uploadError, data } = await supabase.storage
                    .from("products") // Make sure this bucket exists!
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from("products")
                    .getPublicUrl(filePath);

                // 3. Create DB Record
                // Determine file type (simple check)
                const isImage = file.type.startsWith("image/");
                const fileType = isImage ? "image" : "document";

                // Optional: Get dimensions for images
                let width, height;
                if (isImage) {
                    // simplified: could load Image object to get naturalWidth/Height
                }

                await createAssetRecord({
                    productId,
                    fileName: file.name,
                    fileType,
                    fileUrl: publicUrl,
                    storagePath: filePath,
                    width,
                    height
                });

                successCount++;
            } catch (error) {
                console.error("Yükleme başarısız: " + file.name, error);
                toast.error(`${file.name} yüklenemedi.`);
            }
        }

        setUploading(false);
        if (successCount > 0) {
            toast.success(`${successCount} dosya başarıyla yüklendi.`);
            router.refresh();
            if (onUploadComplete) onUploadComplete();
        }
    }, [productId, router, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
            'application/pdf': ['.pdf']
        },
        disabled: uploading
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
                {uploading ? (
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                ) : (
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="text-sm text-muted-foreground">
                    {uploading ? (
                        <p>Dosyalar yükleniyor...</p>
                    ) : isDragActive ? (
                        <p>Dosyaları buraya bırakın...</p>
                    ) : (
                        <p>Resim veya PDF dosyalarını buraya sürükleyin veya seçmek için tıklayın</p>
                    )}
                </div>
            </div>
        </div>
    );
}
