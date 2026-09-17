# Awaiten photography archive

Photography follows Writings in Archives. The archive contains all 17 photography collections and 1,154 gallery photographs in the Awaiten catalog, including their existing day/location groups, dates, client details and descriptions. Two additional cover assets are also retained.

Five collections are unlisted: Wali & Aylia, RISE Academy Lower School, RISE Academy Senior Portraits, Boilermake XII winners in San Francisco, and Tanzania 2025 FX3. Public browsing shows 12 collections and 828 photographs.

Set `unlisted: true` in a collection's frontmatter (or the **Unlisted (direct link only)** checkbox in Pages CMS). Unlisted pages retain their direct URLs but are excluded from archive folders, search, counts, experience previews, related/previous/next links, and the sitemap. Their static and browser metadata use `noindex, follow`; this is link-only visibility, not password protection. Imports preserve the existing per-collection visibility setting.

## Sources and local copies

- Existing repository clone: `../awaiten.com`, verified against its remote HEAD at `4139f9b82bc6db4cd509c0a383753c0d8dc11c92`.
- Verbatim project catalog: `content/sources/awaiten-projects.json`.
- Original image source: `https://cdn.awaiten.com/images/…` (Cloudflare R2, without image transforms).
- Full-resolution originals: `awaiten-originals.local/images/…`. These are intentionally ignored by Git and excluded from the deployed site. Keep this directory when backing up the originals.
- Website images: served directly from `https://cdn.awaiten.com/cdn-cgi/image/…` using Cloudflare Image Transforms: 1,800-pixel-wide viewer images and 640-pixel-wide thumbnails with automatic format negotiation. No photography image binaries are included in the Git repository or site build.
- Previously generated local previews: `awaiten-previews.local/images/…`, retained as an ignored local cache. The website does not use these files.
- Inventory: `content/sources/awaiten-photography-assets.json`, recording the original URL, local original path, Cloudflare display URLs, dimensions, byte count and SHA-256 checksum for each of the 1,156 assets.
- Editable archive entries: `content/archives/photography/` and `content/projects/awaiten-photography.md`.

Gallery frames use 960-pixel Cloudflare previews with recorded dimensions for stable rows that retain the original framing. Collection filters are text links with an active underline, and the full-screen image viewer supports keyboard navigation, touch swipes, Escape, and focus restoration.

The import covers every photography asset referenced by the cloned catalog. It does not claim to enumerate unrelated or unreferenced objects in the Cloudflare account. The original catalog is preserved verbatim; the displayed company name is normalized to `sync. labs`.

## Reproduce and verify

Run `node scripts/import-awaiten-photography.mjs` to download/resume the import and regenerate the archive entries. The importer checks CDN response types and byte counts, validates image decoding, and checks disk space before downloading. Existing originals of the expected size are reused. Original files total 8,465,466,723 bytes (8.46 GB).

Run `node scripts/import-awaiten-photography.mjs --content-only` to rebuild the entries from the stored catalog without network access. This overwrites imported entries, so preserve any editorial changes before rerunning it.

Run `npm run test:publishing` for catalog and Cloudflare URL integrity checks, `npm run build` for the full static site, and `node tests/photography.browser.mjs` with a preview at `http://127.0.0.1:5198` (or set `PHOTOGRAPHY_TEST_URL`) for desktop/mobile navigation, filtering, keyboard, touch, and focus checks.

Use `VERIFY_PHOTOGRAPHY_ORIGINALS=1 npm run test:publishing` to additionally read every full-resolution original and compare its bytes and SHA-256 checksum to the inventory.

Run `node tests/unlisted-photography.browser.mjs` against a production preview (default port 5213, override with `PHOTOGRAPHY_TEST_URL`) to verify all five direct links, their search metadata, public search, category prerenders, sitemap exclusion, and the Tanzania filters.
