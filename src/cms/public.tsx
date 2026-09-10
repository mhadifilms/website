import { ReadingTools } from "./reading-tools";
import { SubscribeForm } from "./subscribe";
import { postMeta, relatedPosts } from "../../shared/post-meta.js";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { api, formatDate } from "./api";
import type { PublicPost } from "./types";
import { ArticleView } from "./article-view";
import { applyPageMeta } from "@/lib/seo";
import "./cms.css";
export default function WritingPage() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const [posts, setPosts] = useState<PublicPost[] | null>(null),
    [error, setError] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useSearchParams();
  const query = search.get("q") || "";
  const setQuery = (value: string) => setSearch(value ? {q:value} : {}, {replace:true});
  useEffect(() => {
    let active = true;
    api<PublicPost[]>("/public/posts")
      .then((result) => {
        if (active) setPosts(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const post = posts?.find((p) => p.path === pathname),
    index = pathname === "/writing";
  useEffect(() => {
    if (post || index)
      applyPageMeta(
        post
          ? postMeta(post.snapshot, pathname)
          : {
              title: "Creative Chaos | Writing by M Hadi",
              description: "Essays, notes, and things I am figuring out.",
              canonicalPath: "/writing/",
            },
      );
  }, [post, index, pathname]);
  const filtered = posts?.filter((p) => `${p.snapshot.title} ${p.snapshot.text}`.toLowerCase().includes(query.toLowerCase())) || [];
  return (
    <main key={pathname} id="content" tabIndex={-1} data-reading-route={posts ? pathname : undefined} className="native-writing-page">
      <a className="post-skip-link" href={index ? "#writing-list" : "#article"}>
        Skip to {index ? "writing" : "article"}
      </a>
      <nav>
        <Link to={index ? "/archives" : "/writing"}>
          <ArrowLeft size={17} /> {index ? "Archives" : "Writing"}
        </Link>
        <div className="reading-nav-actions">
          <a href="#newsletter">Subscribe</a>
        <Link to="/" className="native-wordmark">
          mh.
        </Link>
        </div>
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
        <div className="native-writing-index" id="writing-list">
          <header>
            <h1>Creative Chaos</h1>
            <p>Writing, making things, and figuring it out along the way.</p>
            <label className="cms-search">
              <input
                ref={searchInput}
                aria-label="Search writing"
                placeholder="Find a thought…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </header>
          <div className="writing-results" role="status">{query ? `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"} found` : `${posts.length} pieces from the writing desk`}</div>
          {query && filtered.length === 0 && <div className="writing-empty"><h2>No writing found for “{query}”.</h2><p>Try a different word, or browse the full archive.</p><button type="button" onClick={() => {setQuery("");searchInput.current?.focus();}}>Clear search</button></div>}
          {filtered.map((p, i) => (
              <Link className={`native-writing-row ${!query && i === 0 ? "writing-featured" : ""}`} key={p.id} to={p.path}>
                <time dateTime={p.snapshot.date}>
                  {formatDate(p.snapshot.date)}
                </time>
                <div>
                  <h2>{p.snapshot.title}</h2>
                  <p>{p.snapshot.subtitle || p.snapshot.text.slice(0, 180)}</p>
                </div>
                {p.snapshot.cover && (
                  <img className="writing-cover" src={p.snapshot.cover} alt="" loading="lazy" decoding="async" />
                )}
                <ArrowUpRight size={19} />
              </Link>
            ))}
          {posts.length === 0 && <p>The next piece is on its way.</p>}
          <SubscribeForm />
        </div>
      ) : post ? (
        <>
          <ReadingTools key={post.id} title={post.snapshot.title} />
          <ArticleView key={post.id} snapshot={post.snapshot} />
          <aside className="post-related" aria-label="Continue reading">
            <h2>Continue reading</h2>
            {relatedPosts(posts, post).map((item: PublicPost) => (
              <Link key={item.id} to={item.path}>
                {item.snapshot.cover && <img src={item.snapshot.cover} alt="" loading="lazy" />}
                <span>{item.snapshot.title}<small>{formatDate(item.snapshot.date)}</small></span>
                <ArrowUpRight size={19} />
              </Link>
            ))}
          </aside>
        </>
      ) : (
        <div className="cms-empty">
          <h1>This page isn’t published.</h1>
          <Link to="/writing">Browse the writing archive</Link>
        </div>
      )}
    </main>
  );
}
