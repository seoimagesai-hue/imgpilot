# Landing redesign — remaining tool hubs + convert pairs

Date: 2026-08-04  
BUILD_ID served: `cW23Zcvq19k9ekgol3BYp`

## Pages upgraded

### Hubs (GuestToolWorkspace / BulkToolWorkspace)
| Route | Honest notes |
|---|---|
| `/geotag-image` | JPEG GPS write only |
| `/image-metadata` | Inspect / view only |
| `/image-metadata-editor` | Draft + sidecar export; no embedded EXIF write |
| `/bulk-image-tools` | compress/resize/convert; guest bulk AI off; `?tool=` deep links |

### SEO convert pairs (LandingToolWorkspace)
| Route | Honest notes |
|---|---|
| `/jpg-to-png` | No invented alpha; PNG may be larger |
| `/jpg-to-avif` | Fail-closed if encoder unavailable |
| `/png-to-avif` | Fail-closed; WebP fallback recommended |
| `/webp-to-avif` | Fail-closed; keep WebP fallbacks |

## Verification
- `tsc --noEmit` Passed
- `tests/landing-seo-content.test.ts` Passed
- `next build` Passed
- Live HTTP smoke: all 8 EN pages 200 + tool-workspace + illustration 200; UR samples 200
- `jpeg-to-png` redirect 307

## Illustrations
Generated branded overlays from sibling convert/bulk art into `{slug}-{hero,steps}.webp` (+ compare for convert pairs). Unique commissioned replacements can come later.
