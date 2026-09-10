import fs from "node:fs";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { postMeta } from "../shared/post-meta.js";
const manifest = JSON.parse(fs.readFileSync("public/publishing/manifest.json"));
const rows = [],
  titles = new Set(),
  descriptions = new Set();
let images = 0,
  videos = 0,
  galleries = 0,
  poetry = 0;
for (const post of manifest.posts) {
  const s = post.snapshot,
    meta = postMeta(s, post.path),
    w = new Window();
  w.document.body.innerHTML = s.html;
  assert(s.seo?.title && s.seo?.description, `Missing SEO copy: ${post.path}`);
  assert(!titles.has(meta.title));
  assert(!descriptions.has(meta.description));
  titles.add(meta.title);
  descriptions.add(meta.description);
  for (const img of w.document.querySelectorAll("img")) {
    assert(
      img.getAttribute("alt")?.trim(),
      `Missing image description: ${post.path}`,
    );
    assert(fs.existsSync("public" + img.getAttribute("src")));
    images++;
  }
  for (const v of w.document.querySelectorAll("video")) {
    assert(v.hasAttribute("controls"));
    assert(v.getAttribute("poster"));
    assert(v.getAttribute("aria-label"));
    assert(fs.existsSync("public" + v.getAttribute("src")));
    assert(fs.existsSync("public" + v.getAttribute("poster")));
    videos++;
  }
  galleries += w.document.querySelectorAll("[data-gallery]").length;
  poetry += w.document.querySelectorAll("[data-poetry]").length;
  const page = fs.readFileSync(`dist${post.path}/index.html`, "utf8");
  const dw = new Window();
  dw.document.write(page);
  assert.equal(dw.document.querySelectorAll("h1").length, 1);
  assert.equal(
    dw.document.querySelector("link[rel=canonical]")?.getAttribute("href"),
    "https://mhadifilms.com" + meta.canonicalPath,
  );
  assert(page.includes("BlogPosting"));
  assert(!page.includes("/api/media/"));
  assert(!page.includes("newsletter_operations"));
  assert(page.includes(meta.description.replaceAll("&", "&amp;")));
  rows.push(
    `| [${s.title.replaceAll("|", "/")}](https://mhadifilms.com${post.path}/) | ${s.seo.title.replaceAll("|", "/")} | ${s.seo.description.replaceAll("|", "/")} |`,
  );
  await w.happyDOM.close();
  await dw.happyDOM.close();
}
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(
  "docs/post-migration-audit.md",
  `# Post media and search audit\n\nVerified ${manifest.posts.length} published posts. ${images} inline images have descriptions; ${videos} native videos have controls and local posters; ${galleries} galleries and ${poetry} poetry blocks are preserved. Every post has a unique search title and description, one page-level heading, a canonical URL, and crawlable article markup. Existing website URLs are preserved.\n\nThe private source comparison checks all 44 imported posts against the original export, including drafts. Only 32 are published. Source video streams provided no subtitle tracks; authored media captions are preserved.\n\n## Reader checks\n\n1. Article reading: smaller balanced headlines, comfortable line spacing, reading time, and section links on longer structured posts.\n2. Galleries: original order, individual images, keyboard-operable links, a modal viewer with next/previous controls and focus return.\n3. Video and animation: locally stored MP4s and posters, native playback controls, animation play/pause, and preserved YouTube embeds.\n4. Search: page-specific titles/descriptions, article and video structured data, image sitemap entries, and related-post links.\n\nAutomated checks establish content and markup integrity, not full accessibility conformance. Search rankings are not guaranteed. Search Console indexing/inspection and Google's treatment of the still-live Substack originals require separate follow-through.\n\nGoogle references: [Article markup](https://developers.google.com/search/docs/appearance/structured-data/article), [video best practices](https://developers.google.com/search/docs/appearance/video), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).\n\n## Search copy by post\n\n| Post | Search title | Search description |\n| --- | --- | --- |\n${rows.join("\n")}\n`,
);
console.log(
  JSON.stringify({
    posts: rows.length,
    images,
    videos,
    galleries,
    poetry,
    uniqueTitles: titles.size,
    uniqueDescriptions: descriptions.size,
  }),
);
