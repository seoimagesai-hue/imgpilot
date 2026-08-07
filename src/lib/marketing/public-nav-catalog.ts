/**
 * Public chrome navigation catalog — consumer tools only.
 * Links must match existing public routes; no invented landings.
 */
import type {LucideIcon} from "lucide-react";
import {
  BookOpen,
  CircleHelp,
  Crop,
  Droplets,
  FileImage,
  FileText,
  Focus,
  ImageIcon,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCw,
  Tag,
  Type,
} from "lucide-react";

export type NavLinkItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type NavColumn = {
  title: string;
  items: NavLinkItem[];
};

export const IMAGE_TOOLS_COLUMNS: NavColumn[] = [
  {
    title: "Optimize",
    items: [
      {
        href: "/compress-image",
        title: "Compress Image",
        description: "Reduce file size while keeping quality.",
        icon: Minimize2,
      },
      {
        href: "/resize-image",
        title: "Resize Image",
        description: "Change dimensions for web and social.",
        icon: Maximize2,
      },
      {
        href: "/crop-image",
        title: "Crop Image",
        description: "Trim to the frame you need.",
        icon: Crop,
      },
      {
        href: "/convert-image",
        title: "Convert Image",
        description: "Switch between JPG, PNG, WebP and AVIF.",
        icon: RefreshCw,
      },
    ],
  },
  {
    title: "Edit & create",
    items: [
      {
        href: "/rotate-image",
        title: "Rotate Image",
        description: "Rotate 90° steps or flip for layout.",
        icon: RotateCw,
      },
      {
        href: "/watermark-image",
        title: "Watermark Image",
        description: "Stamp short text with opacity control.",
        icon: Droplets,
      },
      {
        href: "/blur-region",
        title: "Blur Region",
        description: "Manually blur faces or sensitive areas.",
        icon: Focus,
      },
      {
        href: "/meme-generator",
        title: "Meme Generator",
        description: "Add classic top and bottom captions.",
        icon: Type,
      },
    ],
  },
  {
    title: "SEO and metadata",
    items: [
      {
        href: "/image-metadata",
        title: "Image Metadata Viewer",
        description: "Inspect safe EXIF and image properties.",
        icon: FileText,
      },
      {
        href: "/image-metadata-editor",
        title: "Image SEO Metadata Editor",
        description: "Edit SEO fields and export sidecars.",
        icon: Tag,
      },
      {
        href: "/geotag-image",
        title: "Geotag Image",
        description: "Read or write JPEG GPS location.",
        icon: MapPin,
      },
    ],
  },
  {
    title: "Multi-image",
    items: [
      {
        href: "/bulk-image-tools",
        title: "Bulk Compress",
        description: "Compress several images in one batch.",
        icon: Layers,
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Resize",
        description: "Resize a short batch of images.",
        icon: Layers,
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Convert",
        description: "Convert formats for multiple files.",
        icon: Layers,
      },
    ],
  },
];

export const COMPRESS_COLUMNS: NavColumn[] = [
  {
    title: "By format",
    items: [
      {
        href: "/compress-jpg",
        title: "Compress JPG",
        description: "Shrink JPEG photos for faster pages.",
        icon: FileImage,
      },
      {
        href: "/compress-png",
        title: "Compress PNG",
        description: "Reduce PNG size with care for transparency.",
        icon: FileImage,
      },
      {
        href: "/compress-webp",
        title: "Compress WebP",
        description: "Optimize WebP for lighter delivery.",
        icon: FileImage,
      },
    ],
  },
  {
    title: "Popular tasks",
    items: [
      {
        href: "/compress-image",
        title: "Compress Image",
        description: "All supported formats in one tool.",
        icon: Minimize2,
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Compress",
        description: "Guest batches use temporary storage.",
        icon: Layers,
      },
    ],
  },
];

export const RESIZE_COLUMNS: NavColumn[] = [
  {
    title: "By format",
    items: [
      {
        href: "/resize-jpg",
        title: "Resize JPG",
        description: "Scale JPEG images to exact sizes.",
        icon: Maximize2,
      },
      {
        href: "/resize-png",
        title: "Resize PNG",
        description: "Resize PNG without leaving the app.",
        icon: Maximize2,
      },
      {
        href: "/resize-webp",
        title: "Resize WebP",
        description: "Quick WebP dimension changes.",
        icon: Maximize2,
      },
    ],
  },
  {
    title: "Resize tools",
    items: [
      {
        href: "/resize-image",
        title: "Resize Image",
        description: "Universal resize for supported formats.",
        icon: ImageIcon,
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Resize",
        description: "Resize a small guest batch at once.",
        icon: Layers,
      },
    ],
  },
];

export const CONVERT_COLUMNS: NavColumn[] = [
  {
    title: "Convert to JPG",
    items: [
      {
        href: "/png-to-jpg",
        title: "PNG to JPG",
        description: "Flatten PNGs into JPEG for sharing.",
        icon: RefreshCw,
      },
      {
        href: "/webp-to-jpg",
        title: "WebP to JPG",
        description: "Convert WebP back to JPEG.",
        icon: RefreshCw,
      },
    ],
  },
  {
    title: "Convert to PNG",
    items: [
      {
        href: "/jpg-to-png",
        title: "JPG to PNG",
        description: "Move JPEG into PNG when needed.",
        icon: RefreshCw,
      },
      {
        href: "/webp-to-png",
        title: "WebP to PNG",
        description: "Convert WebP images to PNG.",
        icon: RefreshCw,
      },
    ],
  },
  {
    title: "Convert to WebP",
    items: [
      {
        href: "/jpg-to-webp",
        title: "JPG to WebP",
        description: "Modern WebP from JPEG sources.",
        icon: RefreshCw,
      },
      {
        href: "/png-to-webp",
        title: "PNG to WebP",
        description: "Convert PNG into lighter WebP.",
        icon: RefreshCw,
      },
    ],
  },
  {
    title: "Convert to AVIF",
    items: [
      {
        href: "/jpg-to-avif",
        title: "JPG to AVIF",
        description: "AVIF when the runtime can encode.",
        icon: RefreshCw,
      },
      {
        href: "/png-to-avif",
        title: "PNG to AVIF",
        description: "Convert PNG to AVIF format.",
        icon: RefreshCw,
      },
      {
        href: "/webp-to-avif",
        title: "WebP to AVIF",
        description: "Move WebP into AVIF for delivery.",
        icon: RefreshCw,
      },
    ],
  },
];

export const SEO_TOOLS_ITEMS: NavLinkItem[] = [
  {
    href: "/image-metadata",
    title: "Image Metadata Viewer",
    description: "See format, size and safe EXIF fields.",
    icon: FileText,
  },
  {
    href: "/image-metadata-editor",
    title: "Image SEO Metadata Editor",
    description: "Prepare SEO text fields for CMS export.",
    icon: Tag,
  },
  {
    href: "/geotag-image",
    title: "Geotag Image",
    description: "Embed or verify JPEG GPS metadata.",
    icon: MapPin,
  },
];

export const BULK_TOOLS_ITEMS: NavLinkItem[] = [
  {
    href: "/bulk-image-tools",
    title: "Bulk Compress",
    description: "Guest: limited files per batch, temporary storage.",
    icon: Minimize2,
  },
  {
    href: "/bulk-image-tools",
    title: "Bulk Resize",
    description: "Guest batches expire; re-upload after login.",
    icon: Maximize2,
  },
  {
    href: "/bulk-image-tools",
    title: "Bulk Convert",
    description: "Convert multiple images in one guest flow.",
    icon: RefreshCw,
  },
  {
    href: "/bulk-image-tools",
    title: "Bulk Image Tools overview",
    description: "Compress, resize and convert in one place.",
    icon: Layers,
  },
];

export const APP_GRID_SECTIONS: {title: string; items: NavLinkItem[]}[] = [
  {
    title: "Image Tools",
    items: [
      {
        href: "/compress-image",
        title: "Compress",
        description: "Smaller files",
        icon: Minimize2,
      },
      {
        href: "/resize-image",
        title: "Resize",
        description: "Change dimensions",
        icon: Maximize2,
      },
      {
        href: "/crop-image",
        title: "Crop",
        description: "Frame the shot",
        icon: Crop,
      },
      {
        href: "/convert-image",
        title: "Convert",
        description: "Change format",
        icon: RefreshCw,
      },
      {
        href: "/rotate-image",
        title: "Rotate",
        description: "Turn or flip",
        icon: RotateCw,
      },
      {
        href: "/watermark-image",
        title: "Watermark",
        description: "Stamp text",
        icon: Droplets,
      },
      {
        href: "/blur-region",
        title: "Blur",
        description: "Hide regions",
        icon: Focus,
      },
      {
        href: "/meme-generator",
        title: "Meme",
        description: "Caption image",
        icon: Type,
      },
    ],
  },
  {
    title: "SEO Tools",
    items: [
      {
        href: "/image-metadata",
        title: "Metadata Viewer",
        description: "Inspect safely",
        icon: FileText,
      },
      {
        href: "/image-metadata-editor",
        title: "Metadata Editor",
        description: "SEO fields",
        icon: Tag,
      },
      {
        href: "/geotag-image",
        title: "Geotag",
        description: "JPEG GPS",
        icon: MapPin,
      },
    ],
  },
  {
    title: "Bulk",
    items: [
      {
        href: "/bulk-image-tools",
        title: "Bulk Compress",
        description: "Batch compress",
        icon: Minimize2,
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Resize",
        description: "Batch resize",
        icon: Maximize2,
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Convert",
        description: "Batch convert",
        icon: RefreshCw,
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        href: "/pricing",
        title: "Pricing",
        description: "Plans and limits",
        icon: Tag,
      },
      {
        href: "/docs",
        title: "Documentation",
        description: "How things work",
        icon: BookOpen,
      },
      {
        href: "/contact",
        title: "Help",
        description: "Get support",
        icon: CircleHelp,
      },
    ],
  },
];
