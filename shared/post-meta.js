const compact = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();
export function postMeta(snapshot, path, site = "https://mhadifilms.com") {
  const images = [],
    videos = [];
  function walk(node) {
    if (node.type === "image" && node.attrs?.src)
      images.push({ src: node.attrs.src, alt: node.attrs.alt || "" });
    if (node.type === "gallery") images.push(...(node.attrs?.images || []));
    if (node.type === "nativeVideo") {
      videos.push(node.attrs);
      if (node.attrs.poster)
        images.push({ src: node.attrs.poster, alt: node.attrs.title || "" });
    }
    for (const child of node.content || []) walk(child);
  }
  walk(snapshot.document || {});
  const image = snapshot.cover || images[0]?.src || "/media/social-card.png",
    imageAlt = snapshot.cover ? snapshot.coverAlt : images[0]?.alt;
  const title = `${snapshot.seo?.title || snapshot.title} | M Hadi`,
    description = compact(
      snapshot.seo?.description || snapshot.subtitle || snapshot.text,
    ).slice(0, 165);
  const url = new URL(`${path.replace(/\/$/, "")}/`, site).href;
  const absolute = (value) => new URL(value, site).href;
  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: snapshot.title,
    description,
    datePublished: snapshot.date,
    url,
    mainEntityOfPage: url,
    inLanguage: "en",
    image: [absolute(image)],
    wordCount: compact(snapshot.text).split(/\s+/).filter(Boolean).length,
    author: {
      "@type": "Person",
      "@id": `${site}/#person`,
      name: "Muhammad Hadi Yusufali",
      url: `${site}/about`,
    },
    ...(snapshot.tags?.length ? { keywords: snapshot.tags.join(", ") } : {}),
  };
  const videoObjects = videos
    .filter((v) => v.src && v.poster && v.uploadDate && Number(v.duration) > 0)
    .map((v) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: v.title || snapshot.title,
      description: v.caption || description,
      thumbnailUrl: [absolute(v.poster)],
      uploadDate: v.uploadDate,
      duration: `PT${Number(v.duration)}S`,
      contentUrl: absolute(v.src),
    }));
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Creative Chaos",
        item: `${site}/writing/`,
      },
      { "@type": "ListItem", position: 2, name: snapshot.title, item: url },
    ],
  };
  return {
    title,
    description,
    image: absolute(image),
    imageAlt: imageAlt || snapshot.title,
    canonicalPath: `${path.replace(/\/$/, "")}/`,
    jsonLd: [article, breadcrumb, ...videoObjects],
  };
}
export function relatedPosts(posts, current) {
  const terms = (s) =>
    new Set(
      `${s.seo?.title || s.title} ${s.subtitle || ""}`
        .toLowerCase()
        .match(/[a-z]{4,}/g)
        ?.filter(
          (t) =>
            ![
              "with",
              "from",
              "that",
              "this",
              "what",
              "about",
              "some",
              "have",
              "been",
              "their",
              "they",
              "when",
              "your",
              "into",
              "reflection",
              "reflections",
              "personal",
            ].includes(t),
        ) || [],
    );
  const own = terms(current.snapshot);
  return posts
    .filter((p) => p.id !== current.id)
    .map((post) => ({
      post,
      score: [...terms(post.snapshot)].filter((t) => own.has(t)).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.post.snapshot.date.localeCompare(a.post.snapshot.date),
    )
    .slice(0, 3)
    .map((v) => v.post);
}

export function bodyStartsWithCover(snapshot) {
  const first = snapshot.document?.content?.[0];
  return Boolean(snapshot.cover && first?.type === "image" &&
    [first.attrs?.src, first.attrs?.motionPoster].includes(snapshot.cover));
}
