import { test } from "node:test";
import assert from "node:assert/strict";
import { postMeta } from "../shared/post-meta.js";
test("post SEO uses authored overrides and actual media without changing the headline", () => {
  const s = {
    title: "My creative title",
    seo: {
      title: "A specific search title",
      description: "A description of this exact post.",
    },
    date: "2026-07-07T02:38:59Z",
    tags: ["film"],
    text: "One two three",
    document: {
      content: [
        {
          type: "nativeVideo",
          attrs: {
            src: "/publishing/media/film.mp4",
            poster: "/publishing/media/poster.webp",
            title: "A film",
            duration: 81,
            uploadDate: "2026-07-07T02:38:59Z",
          },
        },
      ],
    },
  };
  const meta = postMeta(s, "/writing/a-post");
  assert.equal(meta.title, "A specific search title | M Hadi");
  assert.equal(
    meta.image,
    "https://mhadifilms.com/publishing/media/poster.webp",
  );
  assert.equal(meta.jsonLd[0].headline, s.title);
  assert.equal(meta.jsonLd[0].wordCount, 3);
  assert.equal(meta.jsonLd[2].duration, "PT81S");
  assert.equal(
    meta.jsonLd[2].contentUrl,
    "https://mhadifilms.com/publishing/media/film.mp4",
  );
  assert.equal(meta.canonicalPath, "/writing/a-post/");
});
