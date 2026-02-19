
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

export function SearchInput({ placeholder }: { placeholder: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [text, setText] = useState(searchParams.get("search") || "");
    const [query] = useDebounce(text, 500);

    useEffect(() => {
        // Only update URL if the query value is different from the current URL param
        const currentSearch = searchParams.get("search") || "";
        if (query === currentSearch) return;

        const params = new URLSearchParams(searchParams);
        if (query) {
            params.set("search", query);
        } else {
            params.delete("search");
        }
        router.replace(`${pathname}?${params.toString()}`);
    }, [query, pathname, router, searchParams]);

    return (
        <div className="relative w-full max-w-sm">
            <Input
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full"
            />
        </div>
    );
}
