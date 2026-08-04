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
import {jpgToWebpSeoCompat} from "@/lib/marketing/jpg-to-webp-landing-content";
import {pngToJpgSeoCompat} from "@/lib/marketing/png-to-jpg-landing-content";
import {pngToWebpSeoCompat} from "@/lib/marketing/png-to-webp-landing-content";
import {resizeJpgSeoCompat} from "@/lib/marketing/resize-jpg-landing-content";
import {resizePngSeoCompat} from "@/lib/marketing/resize-png-landing-content";
import {resizeWebpSeoCompat} from "@/lib/marketing/resize-webp-landing-content";
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
  "jpg-to-png": {
    intro:
      "Convert JPG photos to PNG when an editor, printer, or workflow insists on PNG. Upload a JPEG, confirm PNG as the target, convert with the shared guest Convert engine, and download before temporary storage expires about one hour after the session starts. Expect larger files in many photographic cases — this tool prioritizes compatibility, not magically smaller PNGs.",
    why:
      "Some design tools, print pipelines, and legacy CMS modules still standardize on PNG even when the source was a camera JPG. Converting deliberately makes those handoffs boring and predictable. This landing documents JPG→PNG as a supported pair on the guest matrix and reuses Convert Image privacy and limits. It also warns that PNG can grow versus the source JPG, so Compress PNG or a return to WebP may follow. Teams should not treat this as a quality upscale: conversion cannot invent detail JPEG already discarded. Prefer keeping JPG or converting to WebP for public web delivery unless the next step in your toolchain literally refuses JPEG.",
    benefits: [
      {
        title: "Supported pair only",
        body: "JPG to PNG is an explicit matrix entry — not a fabricated format route.",
      },
      {
        title: "Shared Convert engine",
        body: "Identical guest convert policies to the main Convert Image tool.",
      },
      {
        title: "Editor handoff",
        body: "Useful when a teammate’s software rejects JPEG for layering or printing steps.",
      },
      {
        title: "Honest size warning",
        body: "We say up front that PNG may be heavier than the JPG you started with.",
      },
      {
        title: "Private temporary files",
        body: "One-hour guest retention with signed downloads and no public upload dump.",
      },
    ],
    howTo: ["Upload a JPG", "Confirm PNG output", "Convert", "Download the PNG"],
    technicalTitle: "JPG→PNG expectations",
    technical:
      "JPEG is lossy; converting to PNG does not restore discarded detail. Photographic PNGs are often larger. Transparency is not created automatically from a JPG — opaque RGB becomes the usual result. Prefer WebP or keeping JPG for web delivery unless a downstream tool truly requires PNG. Treat this page as a bridge into legacy tooling, then optimize again for the destination that actually serves visitors. If the PNG is destined for the public web, reconsider WebP after the handoff instead of leaving a heavy PNG live forever.",
    faqs: [
      {
        q: "Will JPG to PNG improve photo sharpness?",
        a: "No. It changes container and encoding; it cannot recover detail already lost to JPEG compression.",
      },
      {
        q: "Why did my file get bigger?",
        a: "PNG is often less efficient for photos. Use Compress PNG or convert to WebP for the public web.",
      },
      {
        q: "Does this add transparency?",
        a: "Not automatically. JPG has no alpha channel to preserve.",
      },
      {
        q: "Can I convert many JPGs at once?",
        a: "Use Bulk Image Tools for multi-file convert within guest or signed-in caps.",
      },
    ],
    ctaLabel: "Convert another JPG to PNG",
  },
  "jpg-to-avif": {
    intro:
      "Convert JPG images to AVIF when AVIF encoding is enabled on this deployment. Upload a JPEG, select AVIF, convert through the shared guest Convert engine, and download while the guest session remains valid. If the encoder is unavailable, the tool fails closed instead of shipping a fake AVIF file.",
    why:
      "AVIF can deliver strong compression for forward-looking CDNs and browsers, but it is not universally available in every runtime or client. This landing exists so searchers looking for JPG→AVIF get truthful guidance: supported when encode works, refused when it does not. Processing reuses Convert Image privacy, limits, and matrix checks. Teams should keep WebP or JPG fallbacks during migration. Related links cover JPG to WebP as the safer broadly-supported modern step when AVIF is blocked or still in evaluation. Treat AVIF as an intentional experiment with measurement, not a synonym swap for every photo on the site overnight. Retain WebP as the default modern format until AVIF measurement is complete.",
    benefits: [
      {
        title: "Fail-closed honesty",
        body: "No pretend AVIF downloads when the encoder path is disabled.",
      },
      {
        title: "Modern format option",
        body: "Useful for performance experiments on compatible browsers and CDNs.",
      },
      {
        title: "Shared Convert rules",
        body: "Same guest storage expiry and operation limits as other convert landings.",
      },
      {
        title: "Fallback siblings",
        body: "JPG to WebP remains the practical alternative when AVIF is not ready.",
      },
      {
        title: "Still-image focus",
        body: "Targets photographic JPG masters rather than inventing animation support.",
      },
    ],
    howTo: ["Upload a JPG", "Confirm AVIF availability", "Convert", "Download"],
    technicalTitle: "JPG→AVIF encode gates",
    technical:
      "AVIF encode depends on server capabilities. Browser decode coverage is strong on modern engines but not infinite across every embedded WebView. Encoding can be slower than WebP. Always visual-check text overlays and product edges — aggressive settings may smear fine detail. Guest intakes still emphasize JPEG/PNG/WebP uploads rather than AVIF as a common source. Keep picture-element fallbacks or CDN negotiation during gradual adoption. Encode cost and visual QA matter as much as theoretical compression ratios — ship AVIF only where you can measure regresses quickly. Cache invalidated derivatives separately from JPG masters so rollbacks stay simple during experiments.",
    faqs: [
      {
        q: "What if AVIF conversion fails on this site?",
        a: "The path fails closed. Use JPG to WebP or keep JPG rather than expecting a simulated file.",
      },
      {
        q: "Is AVIF always smaller than WebP?",
        a: "Often competitive, not always. Measure on your own images and devices.",
      },
      {
        q: "Can I upload AVIF as the source here?",
        a: "This landing converts from JPG. Guest intakes still center JPEG/PNG/WebP for most tools.",
      },
      {
        q: "Exact size mode for AVIF?",
        a: "Not supported. Quality/presets only — no invented kilobyte hammer.",
      },
    ],
    ctaLabel: "Convert another JPG to AVIF",
  },
  "png-to-avif": {
    intro:
      "Convert PNG files to AVIF when AVIF encoding is enabled on this deployment. Upload a PNG, select AVIF, convert via the shared guest engine, and download while the guest session is valid. Unavailable encoders fail closed — you will not receive a renamed PNG pretending to be AVIF.",
    why:
      "Some performance programs evaluate AVIF for PNG-heavy design systems and marketing sites. This landing tells that story without overselling universality. Supported when encode works; otherwise use PNG to WebP. Privacy, free limits, and cleanup match Convert Image. Transparency and fine typography need visual QA after encode. Related links keep WebP as the pragmatic modern alternative during gradual rollouts. Do not treat AVIF as a keyword synonym for every PNG in the brand library until encoding, caching, and fallbacks are proven in your environment. Start with a handful of high-traffic assets, compare visual quality and cache hit behavior, then expand only where the win is measurable. Compare alpha edges on dark and light backgrounds before approving brand UI exports.",
    benefits: [
      {
        title: "Encode honesty",
        body: "Fail closed if AVIF cannot be produced on the current runtime.",
      },
      {
        title: "Modern compression option",
        body: "Useful for teams testing AVIF against PNG masters on compatible clients.",
      },
      {
        title: "Shared convert policies",
        body: "Identical guest retention and limit rules as sibling convert pages.",
      },
      {
        title: "WebP sibling path",
        body: "PNG to WebP stays recommended when AVIF is disabled or incomplete.",
      },
      {
        title: "Still-image scope",
        body: "No claim of animated pipeline support on guest convert.",
      },
    ],
    howTo: ["Upload a PNG", "Confirm AVIF availability", "Convert", "Download"],
    technicalTitle: "PNG→AVIF considerations",
    technical:
      "Requires runtime AVIF encode support. Preview alpha edges and small type carefully before replacing production assets. Browser and CDN support continues to evolve; keep fallbacks with WebP or PNG during migration. Guest upload emphasis remains JPEG/PNG/WebP for everyday tools even when AVIF outputs are enabled. Encoding cost and latency can exceed WebP for large canvases — measure before batch automation. Prefer pairing AVIF outputs with a WebP fallback until your CDN negotiation and browser matrix are proven.",
    faqs: [
      {
        q: "What if AVIF is unsupported here?",
        a: "Use PNG to WebP. Do not expect a simulated AVIF download.",
      },
      {
        q: "Does AVIF keep transparency from PNG?",
        a: "Preview the output on your target browsers before shipping UI assets. Confirm alpha and edges rather than assuming parity.",
      },
      {
        q: "Is AVIF accepted as a guest upload input everywhere?",
        a: "Guest intakes emphasize JPEG/PNG/WebP for most tools even when AVIF export exists.",
      },
      {
        q: "Exact byte targets on PNG to AVIF?",
        a: "Not supported — quality presets only. Measure downloads instead of inventing a kilobyte hammer.",
      },
    ],
    ctaLabel: "Convert another PNG to AVIF",
  },
  "webp-to-avif": {
    intro:
      "Convert WebP to AVIF when AVIF encoding is enabled on this deployment. Upload WebP, select AVIF, convert via the shared guest engine, and download while the guest session remains valid. Unavailable encoders fail closed so you never download a mislabeled stand-in file. Guest privacy and one-hour retention still apply.",
    why:
      "Teams mid-migration from WebP to AVIF need a truthful tool that refuses to fake encoder success. This page documents that constraint and keeps the convert matrix accurate for future programmatic SEO expansion. Processing, privacy, and free limits match Convert Image. Keep WebP or JPG fallbacks during rollout. Related links cover WebP to JPG when compatibility outranks bleeding-edge encoding. Programmatic SEO later can spin more long-tail URLs from the same registry pattern — this pair proves the honesty rule first before scale. Keep WebP in production until AVIF encode availability and cache behavior are verified.",
    benefits: [
      {
        title: "Fail-closed encode",
        body: "No pretend AVIF downloads when the runtime cannot encode.",
      },
      {
        title: "Modern format path",
        body: "Useful when AVIF is part of your deliberate delivery strategy.",
      },
      {
        title: "Shared Convert rules",
        body: "Same privacy model and guest operation limits as sibling pages.",
      },
      {
        title: "Fallback options",
        body: "Keep WebP or convert to JPG if AVIF is blocked for a given environment.",
      },
      {
        title: "Registry ready",
        body: "Fits the long-term programmatic SEO registry model for later page expansion.",
      },
    ],
    howTo: ["Upload a WebP", "Confirm AVIF availability", "Convert", "Download"],
    technicalTitle: "WebP→AVIF gates",
    technical:
      "Requires runtime AVIF encode support. Browser decode coverage is strong on modern engines but not infinite. Validate visual quality — aggressive settings can smear fine typography and product edges. Guest intakes still center JPEG/PNG/WebP even when AVIF outputs are enabled. Prefer A/B measuring against existing WebP before declaring AVIF the new default for every asset class. Document encoder availability per environment so staging and production never disagree silently during careful cutovers. Prefer comparing encode latency and visual quality against WebP on representative product photography before a default switch.",
    faqs: [
      {
        q: "Encode disabled — what now for WebP to AVIF?",
        a: "Stay on WebP or use WebP to JPG for compatibility instead of expecting a fake AVIF file from a disabled encoder.",
      },
      {
        q: "Is AVIF always best versus WebP?",
        a: "Not universally; test against your CDN, devices, and encoding latency budget before changing production defaults.",
      },
      {
        q: "Can I upload AVIF as input on guest tools?",
        a: "Most guest intakes still center JPEG/PNG/WebP even when AVIF export exists on convert landings.",
      },
      {
        q: "Is exact size mode part of this convert?",
        a: "No. Convert uses quality and presets, not a kilobyte chase loop that invents exact byte guarantees.",
      },
    ],
    ctaLabel: "Convert another WebP to AVIF",
  },
};

export function getLandingSeoContent(slug: string): LandingSeoContent | null {
  return TOOL_LANDING_SEO_CONTENT[slug] ?? null;
}

export function listSeoContentSlugs(): string[] {
  return Object.keys(TOOL_LANDING_SEO_CONTENT);
}
