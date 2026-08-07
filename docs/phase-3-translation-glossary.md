# Phase 3 Translation Glossary

Source file: [`src/i18n/glossary.json`](../src/i18n/glossary.json)

## Do-not-translate terms

Img Pilot, JPG, JPEG, PNG, WebP, AVIF, EXIF, GPS, SEO, HTML, JSON, CSV, ZIP, CMS, WordPress, Cloudflare R2, R2, Ctrl+V, ⌘V

## Preferred translations (examples)

| Term | es | fr | de | ar | ja |
| --- | --- | --- | --- | --- | --- |
| Alt text | Texto alt | Texte alt | Alt-Text | النص البديل | 代替テキスト |
| Metadata | Metadatos | Métadonnées | Metadaten | البيانات الوصفية | メタデータ |

## Forbidden claims

- Do not imply unlimited processing
- Do not claim always-lossless compression

## Language notes

- **ar / ur:** RTL UI; keep filenames, format codes, URLs, and keyboard shortcuts LTR-isolated
- **ja / ko:** Prefer concise UI labels; keep brand Latin

## Pipeline behaviour

CLI translation protects glossary literals and `{placeholders}` before calling a provider, then restores them. Placeholder mismatches are rejected and not written.
