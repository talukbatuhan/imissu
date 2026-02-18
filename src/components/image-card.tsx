"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MouseEvent } from "react";

interface ImageCardProps {
    src: string;
    img: string;
    hasNote: boolean;
    isSelected: boolean;
    query: string;
    page: number;
}

export function ImageCard({ src, img, hasNote, isSelected, query, page }: ImageCardProps) {
    const router = useRouter();

    const handleClick = (e: MouseEvent) => {
        // Prevent default navigation if needed, but we used router.push
        e.preventDefault();

        // Single click to open
        router.push(`/?image=${img}${query ? `&q=${query}` : ''}&page=${page}`, { scroll: false });
    };

    return (
        <div
            onClick={handleClick}
            className={`group block border rounded-lg overflow-hidden aspect-square relative transition-all duration-300 cursor-pointer
                hover:ring-4 hover:ring-primary/20 
                focus:outline-none focus:ring-4 focus:ring-primary/40
                ${isSelected ? 'ring-4 ring-primary shadow-xl scale-[1.02] z-10' : 'hover:scale-[1.02] hover:shadow-lg hover:z-10'}
            `}
        >
            <div className="relative w-full h-full bg-muted/50">
                <Image
                    src={src}
                    alt={img}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                    unoptimized
                />

                {/* Hover Overlay - REMOVED for Single Click simplicity */}
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8 translate-y-2 group-hover:translate-y-0 transition-transform pointer-events-none">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col min-w-0">
                        <span className="text-white text-xs font-semibold truncate w-full tracking-wide" title={img}>
                            {img}
                        </span>
                    </div>
                    {hasNote && (
                        <div className="bg-yellow-400/90 text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm animate-pulse">
                            NOTE
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
