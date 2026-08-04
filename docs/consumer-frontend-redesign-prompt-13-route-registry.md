# Consumer Frontend Redesign — Prompt 13 route registry

## Strategy

- Central registry: `src/lib/marketing/tool-landing-registry.ts`
- Dynamic pages: `src/app/[locale]/(marketing)/(seo-landings)/[slug]/page.tsx`
- Engines: shared `GuestToolWorkspace` via `LandingToolWorkspace`
- JPG primary; JPEG aliases redirect
- Target-KB pages: **not shipped**
- Social platform pages: **deferred (13b)**

## Indexable landings (Phase A)

### Resize
- `/resize-jpg`, `/resize-png`, `/resize-webp`
- Alias redirects: `/resize-jpeg` → `/resize-jpg`

### Compress
- `/compress-jpg`, `/compress-png`, `/compress-webp`
- Alias redirects: `/compress-jpeg` → `/compress-jpg`

### Crop
- `/crop-jpg`, `/crop-png`, `/crop-webp`, `/crop-image-square` (default 1:1)

### Convert
- `/jpg-to-png`, `/jpg-to-webp`, `/jpg-to-avif`
- `/png-to-jpg`, `/png-to-webp`, `/png-to-avif`
- `/webp-to-jpg`, `/webp-to-png`, `/webp-to-avif`
- JPEG aliases redirect to JPG equivalents

## Generics (unchanged paths)

`/`, `/compress-image`, `/resize-image`, `/crop-image`, `/convert-image`, `/geotag-image`, `/image-metadata`, `/ai-alt-text`, `/image-metadata-editor`, `/bulk-image-tools`, `/pricing`, `/docs`, `/privacy`, `/terms`

## Sitemap

`src/app/sitemap.ts` builds EN/UR URLs from `listSitemapPaths()`.

## Canonical

Self-canonical per landing via `buildPublicMetadata`. Redirect aliases are non-indexable.
