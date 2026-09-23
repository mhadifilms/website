# Add photography without an agent

The local gallery publisher uses the Cloudflare account already signed in through Wrangler. It sends full-resolution photos to the existing `awaiten-cdn` R2 bucket, checks each upload through `cdn.awaiten.com`, writes photo URLs and dimensions to the website, validates the build, and pushes the new gallery to GitHub Pages. It does not keep local photo backups.

1. Double-click **Add Photos.command** in the website folder. Keep its Terminal window open. You can also run `npm run galleries` from this folder and open `http://127.0.0.1:4179` yourself.
3. Choose **New photography gallery** or **Add photos to an existing gallery**. New galleries need a title, date, short introduction, an About section of at least 180 characters, and 1–150 JPEG, PNG, WebP, or AVIF photos. Put them in the intended order and choose the cover.
4. Click **Publish gallery**. Keep the page open until it reports the new URL. The website deployment follows the GitHub push.

The publisher works only on the local `main` branch with a clean working tree. It uses the existing `wrangler` sign-in and requires GitHub push access. New personal galleries go into **M Hadi Photography**; select **Awaiten Photography** for that series. The optional **Unlisted** checkbox removes a collection from browsing and search but does not password-protect its direct URL.

If GitHub push fails after a gallery is committed, the gallery and images remain saved locally and in R2. Run `git push origin main` from this folder; do not submit the same gallery again. If an upload or build fails earlier, the page reports the error and the gallery is not published; some uploaded R2 objects may remain and can be reused or cleaned up later. Source photos on your computer are never deleted by the publisher; only its temporary upload copies are removed.
