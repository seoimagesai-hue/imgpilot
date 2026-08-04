/**
 * Public tool discovery catalog for /search.
 */
export type DiscoverTool = {
  href: string;
  title: string;
  description: string;
  category: "Convert" | "Compress" | "Resize" | "Crop" | "Bulk" | "Hub" | "Other";
  keywords: string[];
};

export const DISCOVER_TOOLS: DiscoverTool[] = [
  {
    href: "/compress-image",
    title: "Image Compressor",
    description: "Compress JPG, PNG and WebP online.",
    category: "Hub",
    keywords: ["compress", "optimize", "reduce size"],
  },
  {
    href: "/resize-image",
    title: "Image Resizer",
    description: "Change image dimensions in your browser.",
    category: "Hub",
    keywords: ["resize", "dimensions", "scale"],
  },
  {
    href: "/crop-image",
    title: "Crop Images",
    description: "Crop with aspect ratios and precise handles.",
    category: "Hub",
    keywords: ["crop", "frame", "ratio"],
  },
  {
    href: "/convert-image",
    title: "Image Converter",
    description: "Convert between JPG, PNG and WebP.",
    category: "Hub",
    keywords: ["convert", "format", "webp"],
  },
  {
    href: "/compress-jpg",
    title: "Compress JPG",
    description: "Optimize photographic JPG files.",
    category: "Compress",
    keywords: ["jpg", "jpeg", "compress"],
  },
  {
    href: "/resize-jpg",
    title: "Resize JPG",
    description: "Resize JPG images for web and social.",
    category: "Resize",
    keywords: ["jpg", "resize"],
  },
  {
    href: "/crop-jpg",
    title: "Crop JPG",
    description: "Crop photographic JPG images.",
    category: "Crop",
    keywords: ["jpg", "crop"],
  },
  {
    href: "/jpg-to-webp",
    title: "JPG to WebP",
    description: "Convert JPG images to WebP.",
    category: "Convert",
    keywords: ["jpg", "webp", "convert"],
  },
  {
    href: "/png-to-jpg",
    title: "PNG to JPG",
    description: "Convert PNG images to JPG.",
    category: "Convert",
    keywords: ["png", "jpg", "convert"],
  },
  {
    href: "/png-to-webp",
    title: "PNG to WebP",
    description: "Convert PNG images to WebP.",
    category: "Convert",
    keywords: ["png", "webp", "convert"],
  },
  {
    href: "/webp-to-jpg",
    title: "WebP to JPG",
    description: "Convert WebP images to JPG.",
    category: "Convert",
    keywords: ["webp", "jpg", "convert"],
  },
  {
    href: "/webp-to-png",
    title: "WebP to PNG",
    description: "Convert WebP images to PNG.",
    category: "Convert",
    keywords: ["webp", "png", "convert"],
  },
  {
    href: "/compress-png",
    title: "Compress PNG",
    description: "Reduce PNG file weight.",
    category: "Compress",
    keywords: ["png", "compress"],
  },
  {
    href: "/compress-webp",
    title: "Compress WebP",
    description: "Tighten WebP delivery assets.",
    category: "Compress",
    keywords: ["webp", "compress"],
  },
  {
    href: "/resize-png",
    title: "Resize PNG",
    description: "Resize PNG while keeping transparency when present.",
    category: "Resize",
    keywords: ["png", "resize"],
  },
  {
    href: "/resize-webp",
    title: "Resize WebP",
    description: "Resize modern WebP images.",
    category: "Resize",
    keywords: ["webp", "resize"],
  },
  {
    href: "/crop-png",
    title: "Crop PNG",
    description: "Crop PNG graphics online.",
    category: "Crop",
    keywords: ["png", "crop"],
  },
  {
    href: "/crop-webp",
    title: "Crop WebP",
    description: "Crop WebP images online.",
    category: "Crop",
    keywords: ["webp", "crop"],
  },
  {
    href: "/bulk-compress",
    title: "Bulk Compress",
    description: "Compress many images and download a ZIP.",
    category: "Bulk",
    keywords: ["bulk", "compress", "batch"],
  },
  {
    href: "/bulk-resize",
    title: "Bulk Resize",
    description: "Resize many images with one size profile.",
    category: "Bulk",
    keywords: ["bulk", "resize", "batch"],
  },
  {
    href: "/bulk-convert",
    title: "Bulk Convert",
    description: "Convert many images in one queue.",
    category: "Bulk",
    keywords: ["bulk", "convert", "batch"],
  },
];

export const POPULAR_DISCOVER_HREFS = [
  "/compress-jpg",
  "/resize-jpg",
  "/convert-image",
  "/compress-image",
] as const;

export function filterDiscoverTools(query: string, category: string | "All"): DiscoverTool[] {
  const q = query.trim().toLowerCase();
  return DISCOVER_TOOLS.filter((tool) => {
    if (category !== "All" && tool.category !== category) return false;
    if (!q) return true;
    const hay = [tool.title, tool.description, tool.category, ...tool.keywords]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
