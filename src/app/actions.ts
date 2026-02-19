
// This file is deprecated. New logic is in src/app/actions/products.ts
"use server";

export async function saveNote(imageKey: string, content: string) {
    return { success: false, error: "Deprecated" };
}

export async function deleteImage(imageKey: string) {
    return { success: false, error: "Deprecated" };
}

export async function deleteImages(imageKeys: string[]) {
    return { success: false, error: "Deprecated" };
}
