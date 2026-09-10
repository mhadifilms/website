# Native publishing CMS

The custom writing desk is at `/admin`. It uses the existing React site, a Tiptap editor, a same-origin Node API, SQLite revisions, and a private media directory. GitHub sign-in only accepts the configured numeric owner ID. The public website serves the last explicitly published revision.

## Run locally

Use the pinned Node 24.20.0 and npm 11.19.0 versions (`.nvmrc` / `packageManager`) for reproducible installs. Run `npm ci`, then `npm run cms:server` and `npm run dev` in separate terminals. Open `http://localhost:5174/admin`. The server writes a single-use development sign-in code to `.cms-data/local-signin-code`; enter that code in the local sign-in form. Development authentication is loopback-only and disabled in production. Vite proxies `/api` to port 8788. Do not expose either development port publicly.

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

## Hosted sign-in and recovery

The owner flow uses single-use browser-bound state and GitHub PKCE (S256), then checks the numeric GitHub account ID before issuing a secure, HttpOnly session. No repository/email scopes are requested. Cancelled, expired, unavailable, or wrong-account callbacks return to the sign-in UI with a retry action. Only `/admin` plus an allowlisted post/view can be a return destination. Provider responses and credentials are never reflected into the URL.

When autosave detects an expired session, the editor opens sign-in in another tab, keeps the current writing in place, and can refresh its CSRF token and retry saving after sign-in. The normal revision conflict checks still apply.

`render.yaml` describes a separate preview service with a 1 GB persistent disk. Its source branch is explicit because the repository default branch is an old archive. Set `CMS_ORIGIN` to the actual assigned HTTPS host, with no path or trailing slash, and register that exact `/api/auth/callback` URL. Register the production callback separately before domain cutover. Render's single reverse proxy is trusted only when its `RENDER=true` environment marker is present. The health check also checks the database connection.

## Full backup and restoration

Use `node scripts/backup-cms.mjs create SOURCE_DIRECTORY NEW_BACKUP_DIRECTORY` for a consistent SQLite snapshot and a copy of every recorded image. It writes a checksum manifest and removes login sessions and pending OAuth states from the backup only. It never changes the source database's sessions or writing. Store the bundle privately; it contains drafts and the original imported source HTML.

Use `node scripts/backup-cms.mjs restore BACKUP_DIRECTORY NEW_RESTORE_DIRECTORY` to verify checksums, database integrity, and complete image coverage before restoring into a new directory. Existing destinations are rejected. Stop the hosted service and switch its data directory only after checking the restored copy. Keep the original as a rollback copy. Neither operation transfers credentials, local sign-in codes, or subscriber CSV files.

The deployment image includes this command so the same backup/restore workflow works on the host. Copy backups off the persistent disk; a backup on the same disk alone does not protect against disk loss.
