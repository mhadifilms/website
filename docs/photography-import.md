# Awaiten photography archive

Photography follows Writings in Archives. The archive contains all 17 photography collections and 1,154 gallery photographs in the Awaiten catalog, including their existing day/location groups, dates, client details and descriptions. Two additional cover assets are also retained.

Five collections are unlisted: Wali & Aylia, RISE Academy Lower School, RISE Academy Senior Portraits, Boilermake XII winners in San Francisco, and Tanzania 2025 FX3. Public browsing shows 12 collections and 828 photographs.

Set `unlisted: true` in a collection's frontmatter (or the **Unlisted (direct link only)** checkbox in Pages CMS). Unlisted pages retain their direct URLs but are excluded from archive folders, search, counts, experience previews, related/previous/next links, and the sitemap. Their static and browser metadata use `noindex, follow`; this is link-only visibility, not password protection. Imports preserve the existing per-collection visibility setting.

## Sources and local copies

- Existing repository clone: `../awaiten.com`, verified against its remote HEAD at `4139f9b82bc6db4cd509c0a383753c0d8dc11c92`.
- Verbatim project catalog: `content/sources/awaiten-projects.json`.
- Original image source: `https://cdn.awaiten.com/images/…` (Cloudflare R2, without image transforms).
- Full-resolution originals remain in the `awaiten-cdn` Cloudflare R2 bucket. The former `awaiten-originals.local/` download was removed after all 1,156 remote objects returned the recorded image type and byte size on September 22, 2026. It is not part of the site or Git.
- Website images: served directly from `https://cdn.awaiten.com/cdn-cgi/image/…` using Cloudflare Image Transforms: 1,800-pixel-wide viewer images and 640-pixel-wide thumbnails with automatic format negotiation. No photography image binaries are included in the Git repository or site build.
- The unused `awaiten-previews.local/` cache was also removed. The website uses Cloudflare Image Transforms directly.
- Inventory: `content/sources/awaiten-photography-assets.json`, recording the original URL, historical local download path, Cloudflare display URLs, dimensions, byte count and SHA-256 checksum for each of the 1,156 assets.
- Editable archive entries: `content/archives/photography/` and `content/projects/awaiten-photography.md`.

Gallery frames use 960-pixel Cloudflare previews with recorded dimensions for stable rows that retain the original framing. Collection filters are text links with an active underline, and the full-screen image viewer supports keyboard navigation, touch swipes, Escape, and focus restoration.

The import covers every photography asset referenced by the cloned catalog. It does not claim to enumerate unrelated or unreferenced objects in the Cloudflare account. The original catalog is preserved verbatim; the displayed company name is normalized to `sync. labs`.

## Reproduce and verify

The historical importer, `node scripts/import-awaiten-photography.mjs`, downloads all 8.46 GB of originals and rewrites the 17 imported entries. Do not run it as part of ordinary gallery publishing; it can overwrite later edits to those entries.

`node scripts/import-awaiten-photography.mjs --content-only` also overwrites those entries. Preserve later editorial changes and added photos before rerunning it.

Run `npm run test:publishing` for catalog and Cloudflare URL integrity checks, `npm run build` for the full static site, and `node tests/photography.browser.mjs` with a preview at `http://127.0.0.1:5198` (or set `PHOTOGRAPHY_TEST_URL`) for desktop/mobile navigation, filtering, keyboard, touch, and focus checks.

`VERIFY_PHOTOGRAPHY_ORIGINALS=1 npm run test:publishing` requires a restored local originals folder; the normal test does not.

Run `node tests/unlisted-photography.browser.mjs` against a production preview (default port 5213, override with `PHOTOGRAPHY_TEST_URL`) to verify all five direct links, their search metadata, public search, category prerenders, sitemap exclusion, and the Tanzania filters.
