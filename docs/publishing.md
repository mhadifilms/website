# Static website publishing

The website remains on GitHub Pages. There is no hosted CMS server, database, or owner OAuth application.

The writing desk and draft backups live in the separate private `mhadifilms/website-cms` repository. The local app saves changes to SQLite and pushes consistent revision/image backups to that private repository. Session cookies, one-time login codes, API keys, and machine configuration are excluded from those backups.

In the CMS, stage a saved post version, then review the Publish screen. The explicit website release exports only staged revisions and images they reference. It updates `public/publishing/manifest.json` and `public/publishing/media/` in this public repository. Later draft changes, social versions, email preparations, original import HTML, and subscriber records are not included.

The existing Pages workflow rebuilds on `main`. Each published article has a real static HTML page, canonical metadata, structured data and a sitemap entry. The browser reads the same static manifest. The website works when the CMS computer is off.

Archiving and staging affect the local edition first. Publish a new edition to apply removals or updates to the live site. Previously public content can remain in public Git history; staging private content should always be intentional.

The local CMS confirms “Live” only after the site's manifest matches the released edition. Network or Git push failures retain local drafts and show an actionable status. A fresh clone of the private repo can restore its `vault` into a new local data folder with the included restore command.

Newsletter delivery and subscriber migration remain separate integration work. Resend's sending domain and dedicated segment/topic are configured; the CMS's public signup endpoint and email delivery are not yet connected. Newsletter signup will need a small public endpoint or hosted form, not a hosted CMS.
