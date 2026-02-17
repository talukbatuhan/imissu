"use server";
import { db } from "@/lib/db";
import { notes } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase";

export async function saveNote(imageKey: string, content: string) {
    try {
        await db
            .insert(notes)
            .values({
                imageKey,
                content,
            })
            .onConflictDoUpdate({
                target: notes.imageKey,
                set: {
                    content,
                    updatedAt: new Date(),
                },
            });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to save note:", error);
        return { success: false, error: "Failed to save note" };
    }
}

export async function deleteImage(imageKey: string) {
    try {
        // 1. Delete from Supabase Storage
        // The bucket path is just the filename if it's in root, but user has 'public/images/' folder structure?
        // Wait, script uploads to "public/images" folder inside bucket "images"??
        // Let's check upload script.
        // Script does: .upload(`public/images/${file}` ...
        // So yes, path is `public/images/${imageKey}`

        const { error } = await supabaseAdmin.storage
            .from("images")
            .remove([`public/images/${imageKey}`]);

        if (error) {
            console.error("Storage delete error:", error);
            throw new Error("Failed to delete image file from storage");
        }

        // 2. Delete note from Database
        await db.delete(notes).where(eq(notes.imageKey, imageKey));

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete image:", error);
        return { success: false, error: "Failed to delete image" };
    }
}

export async function deleteImages(imageKeys: string[]) {
    try {
        if (imageKeys.length === 0) return { success: true };

        // 1. Delete from Supabase Storage
        const paths = imageKeys.map(key => `public/images/${key}`);
        const { error: storageError } = await supabaseAdmin.storage
            .from("images")
            .remove(paths);

        if (storageError) {
            console.error("Storage delete error:", storageError);
            throw new Error("Failed to delete image files");
        }

        // 2. Delete notes from Database using inArray for efficiency
        await db.delete(notes).where(inArray(notes.imageKey, imageKeys));

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete images:", error);
        return { success: false, error: "Failed to delete images" };
    }
}
