import { createClient } from "@supabase/supabase-js";

// Client for public access (anon key)
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client for server-side operations (service role key)
// This bypasses RLS policies. Use only in server components/libs.
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to get public URL
export function getImageUrl(path: string) {
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
}
