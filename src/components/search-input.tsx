"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function SearchInput() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [inputValue, setInputValue] = useState(searchParams.get("q")?.toString() || "");
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    // We can rely on key prop to force re-render if needed, but controlled input is fine.
    // Syncing input with URL is tricky without causing loops.
    // Let's just update based on pathname change if we want clear functionality to work from outside.
    // Actually, let's just use `key` on the Input component for simplicity if we need reset.
    // Or better, only update state if query string actually changes.
    useEffect(() => {
        const query = searchParams.get("q")?.toString() || "";
        if (query !== inputValue) {
            setInputValue(query);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleChange = (term: string) => {
        setInputValue(term);
        handleSearch(term);
    };

    const clearSearch = () => {
        setInputValue("");
        handleSearch("");
    };

    return (
        <div className={cn(
            "relative flex items-center transition-all duration-300 group",
            isFocused ? "w-[240px] md:w-[360px]" : "w-[200px] md:w-[300px]"
        )}>
            <Search className={cn(
                "absolute left-3 w-4 h-4 transition-colors",
                isFocused ? "text-primary" : "text-muted-foreground"
            )} />

            <Input
                placeholder="Search images..."
                className={cn(
                    "pl-9 pr-9 h-10 transition-all border-muted-foreground/20 bg-background/50 hover:bg-background/80 hover:border-muted-foreground/40 text-sm",
                    isFocused && "border-primary/50 ring-2 ring-primary/20 bg-background shadow-md"
                )}
                value={inputValue}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />

            {inputValue && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 w-7 h-7 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={clearSearch}
                >
                    <X className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}
