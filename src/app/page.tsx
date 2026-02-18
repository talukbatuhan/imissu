import { db } from "@/lib/db";
import { getAllImages } from "@/lib/images";
import { getImageUrl } from "@/lib/supabase";
import { ImageViewerModal } from "@/components/image-viewer-modal";
import { ImageGrid } from "@/components/image-grid";

// Constants
const PAGE_SIZE = 48; // Grid 6x8

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ image?: string; q?: string; page?: string }>;
}) {
  const { image: selectedImage, q, page } = await searchParams;
  const rawQuery = q ? decodeURIComponent(q) : "";
  const query = rawQuery.trim().toLowerCase();
  const currentPage = Number(page) || 1;

  // 1. Fetch ALL images (cached)
  let allImages: string[] = [];
  try {
    allImages = await getAllImages();
  } catch (error) {
    console.error("Failed to fetch images list:", error);
    // Continue with empty list to show UI
  }

  // 2. Fetch Notes (Optimize: fetch all note keys for badges)
  // Since we might have 1200+ images, fetching all note keys is still efficient (e.g. 50KB JSON)
  // Alternative: fetch only for current page? But search needs global context.
  // Let's fetch all keys.
  let notedImages = new Set<string>();
  let allNotesData: { imageKey: string; content: string }[] = [];

  try {
    allNotesData = (await db.query.notes.findMany({
      columns: {
        imageKey: true,
        content: true,
      }
    })).map(n => ({ imageKey: n.imageKey, content: n.content || "" }));
    notedImages = new Set(allNotesData.map(n => n.imageKey));
  } catch (e) {
    console.error("DB Error", e);
  }

  // 3. Filter (Search)
  let filteredImages = allImages;
  if (query) {
    const filenameMatches = new Set(allImages.filter(img => img.toLowerCase().includes(query)));
    const contentMatches = new Set(
      allNotesData
        .filter(n => (n.content || "").toLowerCase().includes(query))
        .map(n => n.imageKey)
    );

    const combinedMatches = new Set([...filenameMatches, ...contentMatches]);
    filteredImages = allImages.filter(img => combinedMatches.has(img));
  }

  // 4. Pagination
  const totalItems = filteredImages.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endpointIndex = startIndex + PAGE_SIZE;
  const currentImages = filteredImages.slice(startIndex, endpointIndex);

  // 5. Selected Image Logic
  let initialNote = "";
  let selectedImageUrl = "";
  let nextImage: string | undefined;
  let prevImage: string | undefined;

  if (selectedImage) {
    // Allow selecting image even if not in current page, but must be in full list
    if (allImages.includes(selectedImage)) {
      const foundNote = allNotesData.find(n => n.imageKey === selectedImage);
      initialNote = foundNote?.content || "";
      selectedImageUrl = getImageUrl(selectedImage);

      // Find index in FILTERED list to allow navigation within search results
      const currentIndex = filteredImages.indexOf(selectedImage);
      if (currentIndex !== -1) {
        if (currentIndex > 0) prevImage = filteredImages[currentIndex - 1];
        if (currentIndex < filteredImages.length - 1) nextImage = filteredImages[currentIndex + 1];
      }
    }
  }

  return (
    <>
      <ImageGrid
        images={currentImages}
        notedImages={notedImages}
        query={query || ""}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        selectedImage={selectedImage}
      />

      {selectedImage && selectedImageUrl && (
        <ImageViewerModal
          key={selectedImage}
          imageKey={selectedImage}
          initialNote={initialNote}
          imageUrl={selectedImageUrl}
          nextImage={nextImage}
          prevImage={prevImage}
          query={query}
          page={currentPage}
        />
      )}
    </>
  );
}
