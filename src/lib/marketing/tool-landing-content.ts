/**
 * Unique SEO body copy per landing slug.
 * Route/operation config stays in tool-landing-registry.ts — do not keyword-swap this file.
 */
import {compressJpgSeoCompat} from "@/lib/marketing/compress-jpg-landing-content";
import {compressPngSeoCompat} from "@/lib/marketing/compress-png-landing-content";
import {compressWebpSeoCompat} from "@/lib/marketing/compress-webp-landing-content";
import {cropJpgSeoCompat} from "@/lib/marketing/crop-jpg-landing-content";
import {cropPngSeoCompat} from "@/lib/marketing/crop-png-landing-content";
import {cropWebpSeoCompat} from "@/lib/marketing/crop-webp-landing-content";
import {jpgToAvifSeoCompat} from "@/lib/marketing/jpg-to-avif-landing-content";
import {jpgToPngSeoCompat} from "@/lib/marketing/jpg-to-png-landing-content";
import {jpgToWebpSeoCompat} from "@/lib/marketing/jpg-to-webp-landing-content";
import {pngToAvifSeoCompat} from "@/lib/marketing/png-to-avif-landing-content";
import {pngToJpgSeoCompat} from "@/lib/marketing/png-to-jpg-landing-content";
import {pngToWebpSeoCompat} from "@/lib/marketing/png-to-webp-landing-content";
import {resizeJpgSeoCompat} from "@/lib/marketing/resize-jpg-landing-content";
import {resizePngSeoCompat} from "@/lib/marketing/resize-png-landing-content";
import {resizeWebpSeoCompat} from "@/lib/marketing/resize-webp-landing-content";
import {webpToAvifSeoCompat} from "@/lib/marketing/webp-to-avif-landing-content";
import {webpToJpgSeoCompat} from "@/lib/marketing/webp-to-jpg-landing-content";
import {webpToPngSeoCompat} from "@/lib/marketing/webp-to-png-landing-content";

export type LandingFaq = {q: string; a: string};

export type LandingBenefitCard = {title: string; body: string};

export type LandingSeoContent = {
  /** ~60–90 words */
  intro: string;
  /** ~150 words — tool-specific */
  why: string;
  benefits: LandingBenefitCard[];
  howTo: [string, string, string, string];
  technicalTitle: string;
  technical: string;
  faqs: LandingFaq[];
  ctaLabel: string;
};

export const TOOL_LANDING_SEO_CONTENT: Record<string, LandingSeoContent> = {
  "resize-jpg": resizeJpgSeoCompat(),
  "compress-jpg": compressJpgSeoCompat(),
  "compress-png": compressPngSeoCompat(),
  "compress-webp": compressWebpSeoCompat(),
  "resize-png": resizePngSeoCompat(),
  "crop-jpg": cropJpgSeoCompat(),
  "jpg-to-webp": jpgToWebpSeoCompat(),
  "webp-to-jpg": webpToJpgSeoCompat(),
  "png-to-jpg": pngToJpgSeoCompat(),
  "png-to-webp": pngToWebpSeoCompat(),
  "webp-to-png": webpToPngSeoCompat(),
  "resize-webp": resizeWebpSeoCompat(),
  "crop-png": cropPngSeoCompat(),
  "crop-webp": cropWebpSeoCompat(),
  "jpg-to-png": jpgToPngSeoCompat(),
  "jpg-to-avif": jpgToAvifSeoCompat(),
  "png-to-avif": pngToAvifSeoCompat(),
  "webp-to-avif": webpToAvifSeoCompat(),
  "crop-image-square": {
    intro:
      "Crop any supported guest image into a square frame when profile avatars, catalog tiles, or grid layouts demand 1:1. Upload, confirm the square aspect, process with the shared Crop engine, and download before temporary guest storage expires — about one hour after session creation. This landing is square-intent first, not a duplicate of Crop JPG with a synonym swapped into the headline.",
    why:
      "Square crops fail more often than people admit: faces get clipped, packaging labels lose edges, and marketplace tiles look uneven when freeform crops sneak through. A dedicated square landing sets the default expectation to 1:1 while still using the real Crop Image engine underneath. Supported still formats follow guest MIME rules rather than inventing HEIC or RAW intake. After you lock the square, Resize Image or format-specific resize landings can match storefront pixel boxes, and compress tools can reduce weight. Social-network marketing pages with named Instagram/Facebook templates remain deferred until product is ready — this page stays honest about 1:1 framing only. If a marketplace rejects non-square thumbs, fixing aspect here prevents a later encode that only papered over bad framing.",
    benefits: [
      {
        title: "1:1 by intent",
        body: "The page exists for square outcomes instead of burying aspect locks in generic copy.",
      },
      {
        title: "Shared Crop core",
        body: "No second cropper — same guest processing, privacy, and limits.",
      },
      {
        title: "Avatar and tile ready",
        body: "Useful for profiles, app grids, and marketplace thumbnails that reject rectangles.",
      },
      {
        title: "Format flexible intake",
        body: "Works with the guest-supported still formats rather than locking a single container.",
      },
      {
        title: "Clear follow-ups",
        body: "Related tools cover resize and compress after the square is locked.",
      },
    ],
    howTo: ["Upload an image", "Confirm the square crop", "Process", "Download the 1:1 result"],
    technicalTitle: "Square aspect cropping",
    technical:
      "The crop locks to a 1:1 aspect via guest crop options. Output format follows the processing path for the uploaded type rather than secretly converting everything to JPG. Generative fill outside the square is not offered. Pixel dimensions of the square still depend on the region you select inside the source.",
    faqs: [
      {
        q: "Does square crop set Instagram’s exact pixel size?",
        a: "No. It locks aspect. Use resize afterward if you need a specific width and height.",
      },
      {
        q: "What formats can I upload for square crop?",
        a: "Guest-supported still formats such as JPEG, PNG, and WebP depending on product MIME policy.",
      },
      {
        q: "Can I keep faces centered automatically?",
        a: "Not with AI subject detection on this page — you position the square manually.",
      },
      {
        q: "Is this different from Crop JPG?",
        a: "Yes in intent: square-first defaults and messaging, same underlying Crop engine.",
      },
    ],
    ctaLabel: "Crop another square image",
  },
};

export function getLandingSeoContent(slug: string): LandingSeoContent | null {
  return TOOL_LANDING_SEO_CONTENT[slug] ?? null;
}

export function listSeoContentSlugs(): string[] {
  return Object.keys(TOOL_LANDING_SEO_CONTENT);
}
