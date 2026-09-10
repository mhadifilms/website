import { postMeta, relatedPosts } from "../shared/post-meta.js";
import fs from "node:fs/promises";
import path from "node:path";
const allowed = [
  "seo",
  "title",
  "subtitle",
  "slug",
  "format",
  "date",
  "tags",
  "project",
  "cover",
  "coverAlt",
  "document",
  "html",
  "text",
];
const routePattern = /^\/(writing|archives\/writings)\/[a-z0-9-]+$/;
export async function loadPublication(root) {
  let data;
  try {
    data = JSON.parse(
      await fs.readFile(
        path.join(root, "public/publishing/manifest.json"),
        "utf8",
      ),
    );
  } catch (error) {
    if (error.code === "ENOENT") return { posts: [], managedPaths: [] };
    throw error;
  }
  if (
    data.schema !== 1 ||
    !Array.isArray(data.posts) ||
    !Array.isArray(data.managedPaths)
  )
    throw new Error("Invalid publication manifest.");
  const seen = new Set();
  for (const post of data.posts) {
    if (!routePattern.test(post.path) || seen.has(post.path))
      throw new Error("Invalid or duplicate published path.");
    seen.add(post.path);
    if (
      !post.snapshot ||
      Object.keys(post.snapshot).some((key) => !allowed.includes(key))
    )
      throw new Error("Private fields must not appear in a public snapshot.");
    if (
      !post.snapshot.title ||
      typeof post.snapshot.html !== "string" ||
      !Array.isArray(post.snapshot.tags)
    )
      throw new Error("Invalid published content.");
    if (JSON.stringify(post).includes("/api/media/"))
      throw new Error("Public images must be exported before building.");
  }
  if (data.managedPaths.some((value) => !routePattern.test(value)))
    throw new Error("Invalid managed website path.");
  return data;
}
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function publicationRoute(
  post,
  site = "https://mhadifilms.com",
  allPosts = [],
) {
  const s = post.snapshot,
    meta = postMeta(s, post.path, site);
  return {
    path: post.path,
    output: `${post.path.slice(1)}/index.html`,
    ...meta,
    ogType: "article",
    lastmod: s.date,
    image: meta.image,
    imageAlt: meta.imageAlt,
    imageType: meta.image.endsWith(".webp") ? "image/webp" : undefined,
    media: { image: meta.image },
    extraMeta: [
      { property: "article:published_time", content: s.date },
      { property: "article:author", content: `${site}/about` },
    ],
    prerenderHtml: `<main class="native-writing-page"><nav><a href="/writing">Writing</a><a href="/">mh.</a></nav><article class="native-post"><header><p>M Hadi / <time datetime="${escape(s.date)}">${escape(s.date)}</time></p><h1>${escape(s.title)}</h1>${s.subtitle ? `<p>${escape(s.subtitle)}</p>` : ""}</header>${s.cover ? `<figure><img src="${escape(s.cover)}" alt="${escape(s.coverAlt)}"></figure>` : ""}<div class="post-prose">${s.html}</div><footer><a href="/writing">More writing</a>${relatedPosts(
      allPosts,
      post,
    )
      .map(
        (item) =>
          `<p><a href="${escape(item.path)}">${escape(item.snapshot.title)}</a></p>`,
      )
      .join("")}</footer></article></main>`,
    jsonLd: meta.jsonLd,
  };
}
export function writingIndexRoute(posts) {
  return {
    path: "/writing",
    output: "writing/index.html",
    title: "Creative Chaos | Writing by M Hadi",
    description: "Essays, notes, and things I am figuring out.",
    prerenderHtml: `<main class="native-writing-page"><h1>Creative Chaos</h1>${posts.map((p) => `<article><h2><a href="${escape(p.path)}">${escape(p.snapshot.title)}</a></h2><p>${escape(p.snapshot.subtitle)}</p></article>`).join("")}</main>`,
  };
}
