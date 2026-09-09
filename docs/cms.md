# Native publishing CMS

The custom writing desk is at `/admin`. It uses the existing React site, a Tiptap editor, a same-origin Node API, SQLite revisions, and a private media directory. GitHub sign-in only accepts the configured numeric owner ID. The public website serves the last explicitly published revision.

## Run locally

Use Node 22.18+ or 24 LTS. Run `npm ci`, then `npm run cms:server` and `npm run dev` in separate terminals. Open `http://localhost:5174/admin`. The server writes a single-use development sign-in code to `.cms-data/local-signin-code`; enter that code in the local sign-in form. Development authentication is loopback-only and disabled in production. Vite proxies `/api` to port 8788. Do not expose either development port publicly.

A `.env.cms` file can override settings using `.env.cms.example`. The server data folder must stay outside Git and frontend builds. The repository is public.

## Import existing writing

`npm run cms:import -- /private/path/to/extracted-substack-export --download-media`

The import reads `posts.csv` and HTML, never the subscriber CSV. It retains original HTML privately, copies supported images into private media storage, preserves matching existing archive paths, and records source IDs to make repeat imports idempotent. Published, everyone-audience articles retain published state in the imported runtime; other content stays private. Review `import-report.json` in the private data folder before cutover. Imported media failures keep the original remote reference and are recorded for follow-up.

## Validation

`npm run test:cms`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:browser`.

## Preview deployment before website cutover

Deploy the Dockerfile on a Node-compatible host with a persistent volume mounted at `/data`. Set `CMS_ORIGIN` to the exact HTTPS preview origin, `CMS_OWNER_ID`, `CMS_OWNER_LOGIN`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. Register a GitHub OAuth application whose callback is `${CMS_ORIGIN}/api/auth/callback`; it requests no repository or email scopes. Production startup fails closed without this configuration. Preserve the current GitHub Pages deployment and website DNS until the hosted preview passes authentication, import, backup restoration, and publishing checks.

Before copying private writing to a hosted environment, ensure owner sign-in and private image authorization work. Keep drafts and subscriber records out of source control, static build artifacts, logs, preview fixtures, and PR attachments. Use host volume snapshots plus a consistent SQLite backup and media copy. An export from Settings contains current documents, not the complete revision/media backup.

## Delivered flows

- Post library with full-content search and lifecycle/format filters.
- Rich text with images/captions/alt text, YouTube videos, paste/drop uploads, Markdown shortcuts, and block insertion.
- Server autosave, local recovery, optimistic version checks, revision preview/restore.
- Same-renderer website preview, publish/update, durable scheduled revision, archive/restore.
- Website reader and writing index, with canonical URLs preserved on imports.
- Multiple social versions, ordered X thread parts, copying, external-link tracking.
- Email subject/introduction preparation and HTML/plain-text preview.

## Remaining rollout work

Hosted OAuth/provisioning and preview validation, human review of migration conversions, backup restoration proof, newsletter delivery and subscriber migration, native signup/confirmation/unsubscribe, and final website cutover. Newsletter and Subscribers screens state their unavailable live-service status instead of showing fabricated counts or enabled send controls. No email is sent by this release.
