import type { Snapshot } from "./types"
import { formatDate } from "./api"
import "./cms.css"

export function ArticleView({
  snapshot,
  preview = false,
}: {
  snapshot: Snapshot
  preview?: boolean
}) {
  return (
    <article
      className={`native-post ${snapshot.format === "note" ? "native-post-note" : ""}`}
    >
      <header>
        <p className="post-byline">
          M Hadi <span aria-hidden="true">/</span>{" "}
          <time dateTime={snapshot.date}>{formatDate(snapshot.date)}</time>
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
      {snapshot.cover && (
        <figure className="post-cover">
          <img src={snapshot.cover} alt={snapshot.coverAlt} />
        </figure>
      )}
      <div
        className="post-prose"
        dangerouslySetInnerHTML={{ __html: snapshot.html }}
      />
      <footer className="post-end">
        <span>Creative Chaos</span>
        <p>Writing, making things, and figuring it out along the way.</p>
        {!preview && <a href="/writing">More from the writing desk</a>}
      </footer>
    </article>
  )
}
