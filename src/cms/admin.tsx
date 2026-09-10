import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowUpRight,
  ArrowLeft,
  Feather,
  FileText,
  Images,
  Mail,
  Users,
  Settings2,
  Plus,
  Search,
  LogOut,
  Download,
  RefreshCw,
  ImagePlus,
} from "lucide-react"
import { api, formatTime, postState, setCsrf } from "./api"
import type { Media, Post, Session, Settings } from "./types"
import { PostEditor } from "./editor"
import { MediaPicker } from "./media-picker"
import "./cms.css"

type View = "posts" | "media" | "newsletter" | "subscribers" | "settings"
const navigation = [
  { id: "posts", label: "Posts", icon: FileText },
  { id: "media", label: "Media", icon: Images },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "subscribers", label: "Subscribers", icon: Users },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const
export default function Admin() {
  const [session, setSession] = useState<Session | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true)
  const [params, setParams] = useSearchParams()
  const view = (params.get("view") || "posts") as View,
    id = params.get("post")
  const [post, setPost] = useState<Post | null>(null)
  function loadSession() {
    return api<Session>("/session")
      .then((value) => {
        setCsrf(value.csrf)
        setSession(value)
        setError("")
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    document.title = "Writing desk | M Hadi"
    const robots = document.createElement("meta")
    robots.name = "robots"
    robots.content = "noindex, nofollow"
    document.head.appendChild(robots)
    void loadSession()
    return () => {
      robots.remove()
    }
  }, [])
  useEffect(() => {
    if (!id || !session?.authenticated) return
    let cancelled = false
    api<Post>(`/admin/posts/${id}`)
      .then((value) => {
        if (!cancelled) setPost(value)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [id, session?.authenticated])
  const openPost = (postId: string) => {
    setPost(null)
    setParams({ post: postId })
  }
  if (loading)
    return (
      <div className="cms-loading">
        <Feather size={28} />
        <p>Opening your writing desk…</p>
      </div>
    )
  if (!session?.authenticated)
    return (
      <SignIn
        session={session}
        error={error}
        retry={loadSession}
        signedIn={loadSession}
      />
    )
  if (id && post?.id === id)
    return (
      <PostEditor
        key={post.id}
        initial={post}
        back={() => {
          setPost(null)
          setParams({})
        }}
        openPost={openPost}
      />
    )
  return (
    <div className="cms-shell">
      <a className="cms-skip" href="#cms-content">
        Skip to posts
      </a>
      <aside className="cms-sidebar">
        <a className="cms-brand" href="/" aria-label="M Hadi website">
          <span className="cms-brand-mark">mh.</span>
          <span>Writing desk</span>
        </a>
        <nav aria-label="Writing desk">
          {navigation.map((item) => (
            <button
              key={item.id}
              aria-current={view === item.id && !id ? "page" : undefined}
              onClick={() => {
                setPost(null)
                setParams(item.id === "posts" ? {} : { view: item.id })
              }}
            >
              <item.icon size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="cms-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            Open website
            <ArrowUpRight size={16} />
          </a>
          <button
            onClick={() =>
              void api("/admin/logout", { method: "POST" })
                .then(loadSession)
                .catch((e) => setError(e.message))
            }
          >
            <LogOut size={15} /> Sign out
          </button>
          <span>Creative Chaos</span>
        </div>
      </aside>
      <main className="cms-workspace" id="cms-content">
        {error && (
          <div role="alert" className="cms-banner cms-error">
            {error}
            <button
              className="cms-button"
              onClick={() => {
                setError("")
                setParams({})
              }}
            >
              Back to posts
            </button>
          </div>
        )}
        {id ? (
          <div className="cms-loading">Opening post…</div>
        ) : view === "posts" ? (
          <Library openPost={openPost} />
        ) : view === "media" ? (
          <MediaLibrary />
        ) : view === "newsletter" ? (
          <NewsletterLibrary openPost={openPost} />
        ) : view === "subscribers" ? (
          <SubscriberSetup />
        ) : (
          <SettingsView />
        )}
      </main>
    </div>
  )
}
function SignIn({
  session,
  error,
  retry,
  signedIn,
}: {
  session: Session | null
  error: string
  retry: () => Promise<void>
  signedIn: () => Promise<void>
}) {
  const [params] = useSearchParams()
  const signInErrors: Record<string, string> = {
    expired: "That sign-in link expired. Please try again.",
    cancelled: "Sign-in was cancelled. You can try again whenever you’re ready.",
    owner: `This writing desk is private. Sign in as ${session?.owner || "the owner"} on GitHub.`,
    unavailable: "GitHub could not complete sign-in. Please try again.",
  }
  const signInError = signInErrors[params.get("signin") || ""] || ""
  const returnParams = new URLSearchParams(params)
  returnParams.delete("signin")
  const returnTo = `/admin${returnParams.size ? `?${returnParams}` : ""}`
  const [code, setCode] = useState(""),
    [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false)
  return (
    <main className="cms-login">
      <a href="/" className="cms-login-back">
        <ArrowLeft size={16} /> Website
      </a>
      <div className="cms-login-paper">
        <span className="cms-brand-mark">mh.</span>
        <h1>
          A little room
          <br />
          for your ideas.
        </h1>
        <p>Your writing, before it goes out into the world.</p>
        {session?.oauthConfigured ? (
          <a className="cms-button cms-primary" href={`/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`}>
            Sign in with GitHub
            <ArrowUpRight size={17} />
          </a>
        ) : session?.development ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setBusy(true)
              setFailure("")
              void api<{ csrf: string }>("/session/local", {
                method: "POST",
                body: { code },
              })
                .then(async (result) => {
                  setCsrf(result.csrf)
                  await signedIn()
                })
                .catch((cause) => setFailure(cause.message))
                .finally(() => setBusy(false))
            }}
          >
            <label>
              Local sign-in code
              <input
                autoComplete="off"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
            <p className="cms-muted">
              Use the one-time code from this computer’s private publishing
              folder.
            </p>
            <button type="submit" className="cms-button cms-primary" disabled={busy}>
              {busy ? "Opening…" : "Open writing desk"}
              <ArrowUpRight size={17} />
            </button>
          </form>
        ) : (
          <p>Owner sign-in is being connected.</p>
        )}
        {(error || failure || signInError) && (
          <p className="cms-error" role="alert">
            {failure || error || signInError}
          </p>
        )}
        {!session && (
          <button className="cms-button" onClick={() => void retry()}>
            Try connecting again
          </button>
        )}
      </div>
      <span className="cms-login-foot">M Hadi / Creative Chaos</span>
    </main>
  )
}
function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("")
  function refresh() {
    return api<Post[]>("/admin/posts")
      .then((value) => {
        setPosts(value)
        setError("")
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    void refresh()
  }, [])
  return { posts, loading, error, refresh }
}
function Library({ openPost }: { openPost: (id: string) => void }) {
  const { posts, loading, error, refresh } = usePosts()
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All posts"),
    [format, setFormat] = useState("all"),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("")
  const filters = ["All posts", "Drafts", "Published", "Scheduled", "Archived"]
  const matches = (p: Post, f: string) =>
    f === "Archived"
      ? !!p.archived_at
      : p.archived_at
        ? false
        : f === "All posts"
          ? true
          : f === "Drafts"
            ? !p.published_revision && !p.scheduled_at
            : f === "Published"
              ? !!p.published_revision
              : !!p.scheduled_at
  const filtered = posts.filter(
    (p) =>
      matches(p, filter) &&
      (format === "all" || p.snapshot.format === format) &&
      `${p.snapshot.title} ${p.snapshot.subtitle} ${p.snapshot.text} ${p.snapshot.tags.join(" ")}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  )
  async function create() {
    setBusy(true)
    try {
      const p = await api<Post>("/admin/posts", { method: "POST", body: {} })
      openPost(p.id)
    } catch (e) {
      setFailure((e as Error).message)
      setBusy(false)
    }
  }
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <h1>Your posts</h1>
          <p>A thought, a story, a work in progress.</p>
        </div>
        <button
          className="cms-button cms-primary"
          disabled={busy}
          onClick={() => void create()}
        >
          <Plus size={18} /> New post
        </button>
      </div>
      <div className="cms-library-tools">
        <label className="cms-search">
          <Search size={18} />
          <input
            aria-label="Search posts"
            placeholder="Find something you wrote…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter by format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="all">Every format</option>
          <option value="essay">Essays</option>
          <option value="note">Short notes</option>
          <option value="photo-set">Photo sets</option>
          <option value="video">Videos</option>
        </select>
      </div>
      <div className="cms-tabs" aria-label="Post status">
        {filters.map((f) => (
          <button
            key={f}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {f}
            <span>{posts.filter((p) => matches(p, f)).length}</span>
          </button>
        ))}
      </div>
      {(error || failure) && (
        <div className="cms-error" role="alert">
          {error || failure}
          <button className="cms-button" onClick={() => void refresh()}>
            Try again
          </button>
        </div>
      )}
      {loading ? (
        <div className="cms-loading">Gathering your posts…</div>
      ) : filtered.length ? (
        <div className="cms-post-list">
          {filtered.map((post) => (
            <button
              className="cms-post-row"
              key={post.id}
              onClick={() => openPost(post.id)}
            >
              <span className="cms-post-format">
                {post.snapshot.format === "photo-set" ? (
                  <Images size={22} />
                ) : (
                  <FileText size={22} />
                )}
              </span>
              <span className="cms-post-info">
                <strong>{post.snapshot.title || "Untitled post"}</strong>
                <span>
                  {post.snapshot.subtitle ||
                    post.snapshot.text.slice(0, 140) ||
                    "The start of something."}
                </span>
                <small>
                  {formatTime(post.updated_at)}
                  {post.snapshot.variants.length > 0
                    ? ` / ${post.snapshot.variants.length} social versions`
                    : ""}
                </small>
              </span>
              <span
                className={`cms-status-badge ${post.published_revision ? "is-published" : ""}`}
              >
                {postState(post)}
              </span>
              <ArrowUpRight className="cms-row-arrow" size={18} />
            </button>
          ))}
        </div>
      ) : (
        <div className="cms-empty">
          <Feather size={38} strokeWidth={1.3} />
          <h2>
            {query
              ? "No posts match that search."
              : filter === "All posts"
                ? "Your next idea starts here."
                : `No ${filter.toLowerCase()} yet.`}
          </h2>
          <p>
            {query
              ? "Try another phrase or clear your filters."
              : "Start with a few lines. You can decide what it becomes later."}
          </p>
          {!query && (
            <button className="cms-button" onClick={() => void create()}>
              Write a post
            </button>
          )}
        </div>
      )}
      <div className="cms-library-footer">
        <span>
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}
        </span>
        <span>Website originals. Everything else follows.</span>
      </div>
    </>
  )
}
function MediaLibrary() {
  const [items, setItems] = useState<Media[]>([]),
    [error, setError] = useState(""),
    [adding, setAdding] = useState(false),
    [query, setQuery] = useState("")
  function load() {
    void api<Media[]>("/admin/media")
      .then(setItems)
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <h1>Your images</h1>
          <p>A place for the things you see.</p>
        </div>
        <button
          className="cms-button cms-primary"
          onClick={() => setAdding(true)}
        >
          <ImagePlus size={17} /> Add image
        </button>
      </div>
      <label className="cms-search">
        <Search size={17} />
        <input
          aria-label="Search images"
          placeholder="Find an image…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="cms-error">
          {error}
        </p>
      )}
      {items.length ? (
        <div className="cms-library-media">
          {items
            .filter((item) =>
              item.name.toLowerCase().includes(query.toLowerCase()),
            )
            .map((item) => (
              <figure key={item.id}>
                <img src={item.url} alt={item.name} />
                <figcaption>
                  <strong>{item.name}</strong>
                  <span>
                    {item.width} × {item.height} /{" "}
                    {Math.round(item.bytes / 1024)} KB
                  </span>
                </figcaption>
              </figure>
            ))}
        </div>
      ) : (
        <div className="cms-empty">
          <Images size={36} />
          <h2>Make room for the pictures.</h2>
          <p>
            Upload images here or drop them straight into a post. Draft images
            stay private until you publish.
          </p>
        </div>
      )}
      {adding && (
        <MediaPicker
          selectLabel="Done"
          close={() => {
            setAdding(false)
            load()
          }}
          select={() => {
            setAdding(false)
            load()
          }}
        />
      )}
    </>
  )
}
function NewsletterLibrary({ openPost }: { openPost: (id: string) => void }) {
  const { posts, loading, error } = usePosts()
  const editions = posts.filter(
    (p) =>
      !p.archived_at &&
      (p.snapshot.newsletter.subject ||
        p.snapshot.newsletter.intro ||
        p.snapshot.newsletter.preview),
  )
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <h1>Letters to your readers</h1>
          <p>One original. An edition for the inbox.</p>
        </div>
      </div>
      <div className="cms-setup-note">
        <Mail size={24} />
        <div>
          <h2>Email preparation is ready.</h2>
          <p>
            Open any post and choose Email edition to write its subject,
            introduction, and preview. Delivery and the Substack subscriber
            migration still need to be connected.
          </p>
        </div>
      </div>
      {error && (
        <p className="cms-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading editions…</p>
      ) : editions.length ? (
        <div className="cms-post-list">
          {editions.map((p) => (
            <button
              key={p.id}
              className="cms-post-row"
              onClick={() => openPost(p.id)}
            >
              <Mail size={22} />
              <span className="cms-post-info">
                <strong>
                  {p.snapshot.newsletter.subject || p.snapshot.title}
                </strong>
                <span>
                  {p.snapshot.newsletter.preview || "Draft email edition"}
                </span>
              </span>
              <span className="cms-status-badge">Draft</span>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
      ) : (
        <div className="cms-empty-small">
          <p>No email editions yet. Start with the post you want to share.</p>
        </div>
      )}
    </>
  )
}
function SubscriberSetup() {
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <h1>Your readers</h1>
          <p>The people following along.</p>
        </div>
      </div>
      <div className="cms-setup-note">
        <Users size={28} />
        <div>
          <h2>Subscriber migration is pending.</h2>
          <p>
            Your Substack export has been retrieved. Readers will appear here
            after Resend delivery, preferences, and unsubscribe handling are
            connected and tested.
          </p>
          <p>There is no live subscriber count available yet.</p>
        </div>
      </div>
    </>
  )
}
function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null),
    [error, setError] = useState("")
  useEffect(() => {
    api<Settings>("/admin/settings")
      .then(setSettings)
      .catch((e) => setError(e.message))
  }, [])
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <h1>Writing desk settings</h1>
          <p>The practical details.</p>
        </div>
      </div>
      {error && (
        <p className="cms-error" role="alert">
          {error}
        </p>
      )}
      {settings && (
        <div className="cms-settings">
          <section>
            <h2>Publication</h2>
            <dl>
              <div>
                <dt>Name</dt>
                <dd>Creative Chaos</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{settings.owner}</dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>{settings.origin}</dd>
              </div>
              <div>
                <dt>Environment</dt>
                <dd>
                  {settings.production ? "Hosted website" : "Local development"}
                </dd>
              </div>
              <div>
                <dt>Sign-in</dt>
                <dd>
                  {settings.signInReady
                    ? "GitHub owner sign-in connected"
                    : "Local sign-in; hosted GitHub sign-in still needs connecting"}
                </dd>
              </div>
            </dl>
          </section>
          <section>
            <h2>Your writing belongs to you.</h2>
            <p>
              Export your current posts, drafts, social versions, and email
              preparations. Downloaded files may contain private writing; store
              them somewhere private.
            </p>
            <a className="cms-button" href="/api/admin/export" download>
              <Download size={16} /> Export posts
            </a>
            <p className="cms-muted">
              This export contains current documents. Full server backups also
              need the revision database and image files.
            </p>
          </section>
          <section>
            <h2>Newsletter</h2>
            <p>{settings.newsletterMessage}</p>
            <button
              className="cms-button"
              onClick={() =>
                void api<Settings>("/admin/settings")
                  .then(setSettings)
                  .catch((e) => setError(e.message))
              }
            >
              <RefreshCw size={16} /> Refresh connection status
            </button>
          </section>
        </div>
      )}
    </>
  )
}
