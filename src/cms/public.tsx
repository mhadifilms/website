import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { api, formatDate } from "./api"
import type { PublicPost } from "./types"
import { SubscribeForm } from "./subscribe"
import { ArticleView } from "./article-view"
import { applyPageMeta } from "@/lib/seo"
import "./cms.css"
export default function WritingPage() {
  const location = useLocation()
  const pathname = location.pathname.replace(/\/+$/, "") || "/"
  const [posts, setPosts] = useState<PublicPost[] | null>(null),
    [error, setError] = useState("")
  const [query, setQuery] = useState("")
  useEffect(() => {
    let active = true
    api<PublicPost[]>("/public/posts")
      .then((result) => {
        if (active) setPosts(result)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [])
  const post = posts?.find((p) => p.path === pathname),
    index = pathname === "/writing"
  useEffect(() => {
    if (post || index)
      applyPageMeta({
        title: post ? `${post.snapshot.title} | M Hadi` : "Writing | M Hadi",
        description:
          post?.snapshot.subtitle ||
          "Creative Chaos. Essays, notes, and things I am figuring out.",
        canonicalPath: pathname,
      })
  }, [post, index, pathname])
  return (
    <main className="native-writing-page">
      <nav>
        <Link to={index ? "/archives" : "/writing"}>
          <ArrowLeft size={17} /> {index ? "Archives" : "Writing"}
        </Link>
        <Link to="/" className="native-wordmark">
          mh.
        </Link>
      </nav>
      {error ? (
        <div className="cms-empty">
          <h1>Writing is temporarily unavailable.</h1>
          <p>Please try again in a moment.</p>
          <button
            className="cms-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : !posts ? (
        <div className="cms-loading">Opening the writing desk…</div>
      ) : index ? (
        <div className="native-writing-index">
          <header>
            <h1>Creative Chaos</h1>
            <p>Writing, making things, and figuring it out along the way.</p>
            <label className="cms-search">
              <input
                aria-label="Search writing"
                placeholder="Find a thought…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </header>
          <SubscribeForm />
          {posts
            .filter((p) =>
              `${p.snapshot.title} ${p.snapshot.text}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((p) => (
              <Link className="native-writing-row" key={p.id} to={p.path}>
                <time dateTime={p.snapshot.date}>
                  {formatDate(p.snapshot.date)}
                </time>
                <div>
                  <h2>{p.snapshot.title}</h2>
                  <p>{p.snapshot.subtitle || p.snapshot.text.slice(0, 180)}</p>
                </div>
                <ArrowUpRight size={19} />
              </Link>
            ))}
          {posts.length === 0 && <p>The next piece is on its way.</p>}
        </div>
      ) : post ? (
        <ArticleView snapshot={post.snapshot} />
      ) : (
        <div className="cms-empty">
          <h1>This page isn’t published.</h1>
          <Link to="/writing">Browse the writing archive</Link>
        </div>
      )}
    </main>
  )
}
