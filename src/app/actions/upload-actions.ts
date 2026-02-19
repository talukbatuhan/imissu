"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function uploadFile(formData: FormData) {
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string || "products";

    if (!file) {
        return { success: false, error: "No file uploaded" };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${Date.now()}-${safeName}`;
        const filePath = `documents/${fileName}`; // Subfolder for documents

        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error("Supabase Upload error:", error);
            return { success: false, error: "Upload failed: " + error.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (e: any) {
        console.error("Server Action Upload Error:", e);
        return { success: false, error: "Server error during upload" };
    }
}
