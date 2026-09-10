import { bodyStartsWithCover } from "../../shared/post-meta.js";
import { SubscribeForm } from "./subscribe";
import { ArticleMedia } from "./article-media";
import { articleHeadings, readingMinutes } from "./article-content";
import type { Snapshot } from "./types";
import { formatDate } from "./api";
import "./cms.css";

export function ArticleView({
  snapshot,
  preview = false,
}: {
  snapshot: Snapshot;
  preview?: boolean;
}) {
  const { content, headings } = articleHeadings(snapshot.html);
  const hasLeadingCover = bodyStartsWithCover(snapshot);
  return (
    <article
      id="article" tabIndex={-1}
      className={`native-post ${snapshot.format === "note" ? "native-post-note" : ""}`}
    >
      <header>
        <p className="post-byline">
          <a href="/">M Hadi</a> <span aria-hidden="true">/</span>{" "}
          <time dateTime={snapshot.date}>{formatDate(snapshot.date)}</time>
          <span aria-hidden="true">/</span>{" "}
          <span>{readingMinutes(snapshot.text)} min read</span>
        </p>
        <h1>{snapshot.title || "Untitled post"}</h1>
        {snapshot.subtitle && (
          <p className="post-subtitle">{snapshot.subtitle}</p>
        )}
        {snapshot.tags.length > 0 && (
          <div className="post-tags">
            {snapshot.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </header>
      {headings.length >= 3 && (
        <details className="post-contents">
          <summary>In this post</summary>
          <nav aria-label="Article sections">
            <ol>
              {headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`}>{h.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        </details>
      )}
      {snapshot.cover && !hasLeadingCover && (
        <figure className="post-cover">
          <img src={snapshot.cover} alt={snapshot.coverAlt} fetchPriority="high" decoding="async" />
        </figure>
      )}
      <ArticleMedia html={hasLeadingCover ? content.replace('loading="lazy"', 'loading="eager" fetchpriority="high"') : content} />
      {!preview && <SubscribeForm />}
      <footer className="post-end">
        <span>Creative Chaos</span>
        <p>Writing, making things, and figuring it out along the way.</p>
        {!preview && <a href="/writing">More from the writing desk</a>}
      </footer>
    </article>
  );
}
