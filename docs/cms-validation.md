# CMS first-release verification

Local verification performed September 9, 2026. This is a working local implementation and a deployable runtime; it is not a claim of production deployment or newsletter readiness.

- Automated API/store checks cover owner sessions, origin/CSRF checks, production rejection of development authentication, private/public media access, published revision isolation, stale writes, revision retention, scheduled restart recovery, canonical paths, reversible archiving, HTML sanitization, caption conversion, and plain-text paragraph boundaries.
- Chromium browser checks cover writing, autosave, upload/caption, desktop/phone preview, explicit publication, private later edits, social copies and links, email preview, failed-save recovery, stale-tab recovery into a separate post, and 390px layouts.
- TypeScript, ESLint, and production build checked.
- The private local import contains 44 posts: 32 published, 12 drafts, 20 preserved legacy article paths, and 62 migrated images. Eight HEIC originals use their browser-compatible Substack image derivatives. Original source HTML and the export remain private. No subscriber data is imported by the publishing importer.
- A SQLite backup was restored into the private workspace data folder and passed `PRAGMA integrity_check`; post and image counts reconciled.
- Desktop and phone screenshots were reviewed. Browser testing found and fixed private-folder image serving, and parser testing found and fixed caption duplication. Images now load in both editor and public preview.

## Supplemental React Doctor triage

The check was rerun against `origin/main` because the repository's default branch is an archived site. Its nine “state updater has side effects” diagnostics point to callbacks passed to the custom `operation` event helper in the editor. That helper flushes the save queue and awaits the operation; these callbacks are not React state updater functions and are not invoked by rendering. The side effects belong to explicit user actions and are covered by publication/recovery browser tests. These are false positives; no rule suppression was added.

Response status diagnostics refer to reading JSON error bodies before checking `response.ok`; both paths check the status before accepting the response. Database JSON reads refer to snapshots written by the validated private store. Component size/control-flow and repeated iteration warnings are maintainability observations; the first implementation keeps related writing operations together. Splitting the editor's panels into smaller files is useful follow-up work without changing the save/publish contract.

## Deployment gates still open

Hosted persistent storage, GitHub OAuth application configuration and callback proof, preview deployment, final migration formatting review, newsletter sending, subscriber reconciliation, signup/confirmation/preferences/unsubscribe, and website DNS cutover. No campaign was sent, no subscribers were activated, and no production website publishing settings were changed.


## Hosted sign-in follow-up — 2026-09-10

- 21 backend/configuration/backup tests passed, including a mocked GitHub owner exchange, PKCE verifier matching, wrong-account rejection, single-use state, expired/cancelled/malformed callbacks, safe return paths, and production configuration guards.
- Five browser journeys passed, including the hosted sign-in failure screen and preserving the draft return URL.
- A fresh full backup of the private migration database restored with integrity `ok`, 44 posts, 62 images, and zero transferred login sessions. All 63 file checksums verified.
- Typecheck, lint and production build passed. React Doctor remains at its previously documented nine false-positive custom-operation updater findings; its advisory component-size and complexity findings remain follow-up maintenance.
- Resend's sending domain is now verified. The dedicated Creative Chaos segment and a private, default-unsubscribed topic have been created. No contacts have been imported and no campaign has been sent.
- The Render service and GitHub OAuth application forms are prepared, but account provisioning, credentials, private upload, and hosted verification remain pending approval. These test results do not claim that OAuth is live on the public website.
