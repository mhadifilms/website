# Writing desk

The website is the original; social versions and email editions belong to a post.

Keep the existing palette: paper #fffff6, ink #000000, white #ffffff, pencil #66645c, folder #c0bca9. Raleway handles controls, DM Serif Display titles, Georgia long reading text. The surrounding website keeps its existing type and motion.

The library is a left-aligned list of documents, with a narrow folder-inspired sidebar and one prominent New post action. The editor is a large unboxed sheet. Its title and body share the public reading measure; secondary details open in a right-hand inspector. A small persistent save indicator and explicit Preview / Publish controls anchor the top bar. On phones the sidebar becomes a compact navigation strip and the inspector stacks below the writing area.

Library: [navigation] [heading + new post / search + filters / document rows]
Editor: [back / saved status / preview / publish] [document canvas] [optional inspector]
Preview: [return / desktop or phone / publish] [actual reader component]

The paper palette is inherited deliberately, not a new visual theme. Avoid activity cards, decorative charts, and theatrical motion. The recognizable element is the document itself, framed by the site's folder-tab vocabulary. Publishing and emailing are separate operations.

## Runtime

A Node server serves the existing built site and same-origin CMS API, backed by a private SQLite database and filesystem media directory on a persistent volume. GitHub OAuth restricts access to the configured numeric owner ID. Local development has an explicit one-time, loopback-only sign-in code. Production refuses development authentication. Deployment is a separate preview before any website DNS cutover.
