import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import Placeholder from "@tiptap/extension-placeholder"
import {
  ArrowLeft,
  ArrowUpRight,
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImagePlus,
  Video,
  Minus,
  Undo2,
  Redo2,
  PanelRight,
  Eye,
  Check,
  CloudOff,
  LoaderCircle,
  Copy,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Monitor,
  Smartphone,
  History,
  Send,
  Settings2,
  Share2,
} from "lucide-react"
import { documentExtensions } from "../../shared/editor-extensions.js"
import { api, formatTime, postState, slugify } from "./api"
import type { Post, Revision, Snapshot, SocialVariant } from "./types"
import { useDraft } from "./use-draft"
import { ArticleView } from "./article-view"
import { MediaPicker } from "./media-picker"
import { Modal } from "./modal"

type Panel = "details" | "social" | "email" | "history" | null
export function PostEditor({
  initial,
  back,
  openPost,
}: {
  initial: Post
  back: () => void
  openPost: (id: string) => void
}) {
  const draft = useDraft(initial)
  const { post, update, flush, status, error } = draft
  const [panel, setPanel] = useState<Panel>(() =>
      window.matchMedia("(min-width: 801px)").matches ? "details" : null,
    ),
    [media, setMedia] = useState(false),
    [pasteFile, setPasteFile] = useState<File>()
  const [preview, setPreview] = useState<Snapshot | null>(null),
    [phone, setPhone] = useState(false),
    [review, setReview] = useState(false)
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [operationError, setOperationError] = useState("")
  const [linkDialog, setLinkDialog] = useState<"link" | "video" | null>(null),
    [link, setLink] = useState(""),
    [linkError, setLinkError] = useState("")
  const [revisions, setRevisions] = useState<Revision[]>([]),
    [historical, setHistorical] = useState<{
      revision: number
      snapshot: Snapshot
    } | null>(null)
  const [schedule, setSchedule] = useState(""),
    [slash, setSlash] = useState(false)
  const [emailPreview, setEmailPreview] = useState<{
      html: string
      text: string
      subject: string
    } | null>(null),
    [plainEmail, setPlainEmail] = useState(false)
  const [hasFocusedBody, setHasFocusedBody] = useState(false)
  const updateRef = useRef(update)
  useEffect(() => {
    updateRef.current = update
  }, [update])
  const editor = useEditor({
    extensions: [
      ...documentExtensions(),
      Placeholder.configure({
        placeholder: "Start writing. Type / for a block, or drop in a photo.",
      }),
    ],
    content: initial.snapshot.document,
    editorProps: {
      attributes: {
        class: "post-prose cms-prose",
        "aria-label": "Post body",
        role: "textbox",
        "aria-multiline": "true",
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files || []).find((f) =>
          f.type.startsWith("image/"),
        )
        if (!file) return false
        event.preventDefault()
        setPasteFile(file)
        setMedia(true)
        return true
      },
      handleDrop: (_view, event) => {
        const file = Array.from(event.dataTransfer?.files || []).find((f) =>
          f.type.startsWith("image/"),
        )
        if (!file) return false
        event.preventDefault()
        setPasteFile(file)
        setMedia(true)
        return true
      },
    },
    onFocus: () => setHasFocusedBody(true),
    onUpdate: ({ editor }) => {
      updateRef.current({
        document: editor.getJSON(),
        html: editor.getHTML(),
        text: editor.getText(),
      })
      setSlash(editor.state.selection.$from.parent.textContent === "/")
    },
  })
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: !!e?.isActive("bold"),
      italic: !!e?.isActive("italic"),
      underline: !!e?.isActive("underline"),
      h2: !!e?.isActive("heading", { level: 2 }),
      h3: !!e?.isActive("heading", { level: 3 }),
      bullet: !!e?.isActive("bulletList"),
      ordered: !!e?.isActive("orderedList"),
      quote: !!e?.isActive("blockquote"),
      undo: !!e?.can().undo(),
      redo: !!e?.can().redo(),
      image: !!e?.isActive("image"),
    }),
  })
  const wordCount = post.snapshot.text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  async function operation(fn: (saved: Post) => Promise<void>) {
    setBusy(true)
    setOperationError("")
    setNotice("")
    try {
      const saved = await flush()
      await fn(saved)
    } catch (cause) {
      setOperationError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }
  function showPanel(next: Panel) {
    setPanel((value) => (value === next ? null : next))
    if (next === "history")
      void api<Revision[]>(`/admin/posts/${post.id}/revisions`)
        .then(setRevisions)
        .catch((e) => setOperationError(e.message))
  }
  const setTitle = (title: string) =>
    update({
      title,
      ...(!post.canonical_path ? { slug: slugify(title) } : {}),
    })
  function insertLink() {
    try {
      const value = new URL(link)
      if (!["https:", "http:", "mailto:"].includes(value.protocol))
        throw new Error()
      if (linkDialog === "video") {
        if (
          ![
            "www.youtube.com",
            "youtube.com",
            "youtu.be",
            "www.youtube-nocookie.com",
          ].includes(value.hostname)
        )
          throw new Error()
        if (!editor?.commands.setYoutubeVideo({ src: value.href }))
          throw new Error()
      } else
        editor
          ?.chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: value.href })
          .run()
      setLinkDialog(null)
      setLink("")
      setLinkError("")
    } catch {
      setLinkError(
        linkDialog === "video"
          ? "Paste a YouTube video URL."
          : "Use a full https://, http://, or mailto: link.",
      )
    }
  }
  const slashCommand = (command: () => void) => {
    if (editor && slash) {
      const { $from } = editor.state.selection
      editor
        .chain()
        .focus()
        .deleteRange({ from: $from.start(), to: $from.end() })
        .run()
    }
    setSlash(false)
    command()
  }
  const toolbar = [
    {
      label: "Bold",
      icon: Bold,
      active: active?.bold,
      action: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: active?.italic,
      action: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: Underline,
      active: active?.underline,
      action: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Heading",
      icon: Heading2,
      active: active?.h2,
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Subheading",
      icon: Heading3,
      active: active?.h3,
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      active: active?.bullet,
      action: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: active?.ordered,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      icon: Quote,
      active: active?.quote,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Link",
      icon: Link2,
      action: () => {
        setLink(editor?.getAttributes("link").href || "")
        setLinkDialog("link")
      },
    },
    {
      label: "Image",
      icon: ImagePlus,
      action: () => {
        setPasteFile(undefined)
        setMedia(true)
      },
    },
    {
      label: "Video",
      icon: Video,
      action: () => {
        setLink("")
        setLinkDialog("video")
      },
    },
    {
      label: "Divider",
      icon: Minus,
      action: () => editor?.chain().focus().setHorizontalRule().run(),
    },
  ]
  if (preview)
    return (
      <div className="cms-preview-shell">
        <header className="cms-editor-bar">
          <button className="cms-button" onClick={() => setPreview(null)}>
            <ArrowLeft size={16} /> Keep writing
          </button>
          <span className="cms-muted">Private preview</span>
          <div className="cms-device-toggle">
            <button
              aria-label="Desktop preview"
              aria-pressed={!phone}
              onClick={() => setPhone(false)}
            >
              <Monitor size={18} />
            </button>
            <button
              aria-label="Phone preview"
              aria-pressed={phone}
              onClick={() => setPhone(true)}
            >
              <Smartphone size={18} />
            </button>
          </div>
          <button
            className="cms-button cms-primary"
            onClick={() => {
              setPreview(null)
              setReview(true)
            }}
          >
            Review publication
          </button>
        </header>
        <div
          className={
            phone ? "cms-preview-paper cms-preview-phone" : "cms-preview-paper"
          }
        >
          <ArticleView snapshot={preview} preview />
        </div>
      </div>
    )
  return (
    <div className={`cms-editor ${panel ? "has-inspector" : ""}`}>
      <header className="cms-editor-bar">
        <button
          className="cms-button cms-back"
          disabled={busy}
          onClick={() => void operation(async () => back())}
        >
          <ArrowLeft size={17} />
          <span>Posts</span>
        </button>
        <div
          className={`cms-save-status ${status === "error" || status === "conflict" ? "is-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {status === "saving" ? (
            <LoaderCircle size={15} className="cms-spin" />
          ) : status === "error" || status === "conflict" ? (
            <CloudOff size={15} />
          ) : (
            <Check size={15} />
          )}
          <span>
            {status === "saved"
              ? "All changes saved"
              : status === "saving"
                ? "Saving…"
                : status === "unsaved"
                  ? "Unsaved changes"
                  : status === "conflict"
                    ? "Newer version found"
                    : "Changes need saving"}
          </span>
        </div>
        <div className="cms-editor-actions">
          <button
            className="cms-button"
            disabled={busy || !!draft.recovery}
            onClick={() =>
              void operation(async (saved) => setPreview(saved.snapshot))
            }
          >
            <Eye size={16} />
            <span>Preview</span>
          </button>
          <button
            className="cms-button cms-primary"
            disabled={busy || !!draft.recovery || !!post.archived_at}
            onClick={() => void operation(async () => setReview(true))}
          >
            {post.published_revision ? "Update" : "Publish"}
            <ArrowUpRight size={16} />
          </button>
          <button
            className="cms-icon"
            onClick={() => showPanel("details")}
            aria-label="Toggle post details"
            aria-expanded={panel !== null}
          >
            <PanelRight size={19} />
          </button>
        </div>
      </header>
      {(error || operationError) && (
        <div className="cms-banner cms-error" role="alert">
          <p>{operationError || error}</p>
          {status === "error" && (
            <button
              className="cms-button"
              onClick={() => void operation(async () => {})}
            >
              Retry save
            </button>
          )}
          {status === "conflict" && (
            <>
              <button
                className="cms-button"
                onClick={() =>
                  void draft
                    .copyRecovery()
                    .then((p) => {
                      draft.discardRecovery()
                      openPost(p.id)
                    })
                    .catch((e) => setOperationError(e.message))
                }
              >
                Save my writing as a new post
              </button>
              <button
                className="cms-button"
                onClick={() => window.location.reload()}
              >
                Reload latest
              </button>
            </>
          )}
        </div>
      )}
      {notice && (
        <div className="cms-banner" role="status">
          {notice}
          <button
            className="cms-icon"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {draft.recovery && (
        <div className="cms-banner cms-recovery">
          <div>
            <strong>There’s unsaved writing from this device.</strong>
            <p>
              Recovery saved {formatTime(draft.recovery.savedAt)}. Review it
              before continuing.
            </p>
          </div>
          <button
            className="cms-button"
            onClick={() =>
              void draft
                .copyRecovery()
                .then((p) => {
                  draft.discardRecovery()
                  openPost(p.id)
                })
                .catch((e) => setOperationError(e.message))
            }
          >
            Open recovered copy
          </button>
          {draft.recovery.version === post.version && (
            <button
              className="cms-button"
              onClick={() => {
                const doc = draft.recovery?.snapshot.document
                draft.recover()
                if (doc) editor?.commands.setContent(doc, { emitUpdate: false })
              }}
            >
              Restore here
            </button>
          )}
          <button className="cms-button" onClick={draft.discardRecovery}>
            Use server version
          </button>
        </div>
      )}
      <div className="cms-editor-layout" inert={!!draft.recovery || busy}>
        <main className="cms-writing-area" id="cms-content">
          <div className="cms-document-meta">
            <span className="cms-status-badge">{postState(post)}</span>
            <span>
              {post.snapshot.format === "photo-set"
                ? "Photo set"
                : post.snapshot.format}
            </span>
            <span>{wordCount.toLocaleString()} words</span>
          </div>
          {post.import_notes && (
            <details className="cms-import-note">
              <summary>Imported from Substack · review formatting</summary>
              <p>{post.import_notes}</p>
            </details>
          )}
          {post.snapshot.cover ? (
            <figure className="cms-cover">
              <img src={post.snapshot.cover} alt={post.snapshot.coverAlt} />
              <button
                className="cms-button"
                onClick={() => update({ cover: "", coverAlt: "" })}
              >
                Remove cover
              </button>
            </figure>
          ) : (
            <button
              className="cms-cover-add"
              onClick={() => {
                setPasteFile(undefined)
                setMedia(true)
                setPanel("details")
              }}
            >
              <ImagePlus size={17} /> Add an image
            </button>
          )}
          <textarea
            className="cms-title"
            aria-label="Post title"
            placeholder="Untitled post"
            value={post.snapshot.title}
            rows={1}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="cms-subtitle"
            aria-label="Post subtitle"
            placeholder="Add a subtitle, if it needs one…"
            value={post.snapshot.subtitle}
            rows={1}
            onChange={(e) => update({ subtitle: e.target.value })}
          />
          <div className="cms-toolbar" role="toolbar" aria-label="Formatting">
            {toolbar.map((tool) => (
              <button
                key={tool.label}
                className="cms-icon"
                title={tool.label}
                aria-label={tool.label}
                aria-pressed={tool.active}
                onClick={tool.action}
              >
                <tool.icon size={17} />
              </button>
            ))}
            <span className="cms-toolbar-gap" />
            <button
              className="cms-icon"
              title="Undo"
              aria-label="Undo"
              disabled={!active?.undo}
              onClick={() => editor?.chain().focus().undo().run()}
            >
              <Undo2 size={17} />
            </button>
            <button
              className="cms-icon"
              title="Redo"
              aria-label="Redo"
              disabled={!active?.redo}
              onClick={() => editor?.chain().focus().redo().run()}
            >
              <Redo2 size={17} />
            </button>
          </div>
          {active?.image && hasFocusedBody && (
            <div className="cms-image-controls">
              <label>
                Alt text
                <input
                  value={editor?.getAttributes("image").alt || ""}
                  onChange={(e) =>
                    editor
                      ?.chain()
                      .updateAttributes("image", { alt: e.target.value })
                      .run()
                  }
                />
              </label>
              <label>
                Caption
                <input
                  value={editor?.getAttributes("image").caption || ""}
                  onChange={(e) =>
                    editor
                      ?.chain()
                      .updateAttributes("image", { caption: e.target.value })
                      .run()
                  }
                />
              </label>
              <button
                className="cms-button"
                onClick={() => {
                  const attrs = editor?.getAttributes("image")
                  if (attrs)
                    update({ cover: attrs.src, coverAlt: attrs.alt || "" })
                }}
              >
                Use as cover
              </button>
            </div>
          )}
          <EditorContent editor={editor} />
          {slash && (
            <div className="cms-slash-menu" aria-label="Insert block">
              {toolbar
                .filter((t) =>
                  [
                    "Heading",
                    "Subheading",
                    "Bulleted list",
                    "Quote",
                    "Image",
                    "Video",
                    "Divider",
                  ].includes(t.label),
                )
                .map((tool) => (
                  <button
                    key={tool.label}
                    onClick={() => slashCommand(tool.action)}
                  >
                    <tool.icon size={16} />
                    {tool.label}
                  </button>
                ))}
              <button onClick={() => setSlash(false)}>Dismiss</button>
            </div>
          )}
          <div className="cms-document-end">
            <span>{Math.max(1, Math.ceil(wordCount / 220))} min read</span>
            <span>Last saved {formatTime(post.updated_at)}</span>
          </div>
        </main>
        {panel && (
          <aside className="cms-inspector" aria-label="Post inspector">
            <div className="cms-inspector-tabs">
              {(
                [
                  { id: "details", icon: Settings2, label: "Details" },
                  { id: "social", icon: Share2, label: "Social versions" },
                  { id: "email", icon: Send, label: "Email edition" },
                  { id: "history", icon: History, label: "History" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  className="cms-icon"
                  title={tab.label}
                  aria-label={tab.label}
                  aria-pressed={panel === tab.id}
                  onClick={() => showPanel(tab.id)}
                >
                  <tab.icon size={18} />
                </button>
              ))}
              <button
                className="cms-icon cms-close-inspector"
                aria-label="Close inspector"
                onClick={() => setPanel(null)}
              >
                <X size={18} />
              </button>
            </div>
            {panel === "details" && (
              <div className="cms-inspector-body">
                <h2>Post details</h2>
                <p className="cms-muted">The home for this piece.</p>
                <div className="cms-fields">
                  <label>
                    Format
                    <select
                      value={post.snapshot.format}
                      onChange={(e) =>
                        update({ format: e.target.value as Snapshot["format"] })
                      }
                    >
                      <option value="essay">Essay</option>
                      <option value="note">Short note</option>
                      <option value="photo-set">Photo set</option>
                      <option value="video">Video</option>
                    </select>
                  </label>
                  <label>
                    Website address
                    <input
                      value={post.snapshot.slug}
                      disabled={!!post.canonical_path}
                      onChange={(e) =>
                        update({ slug: slugify(e.target.value) })
                      }
                    />
                    <span>
                      {post.canonical_path ||
                        `/writing/${post.snapshot.slug || "your-post"}`}
                    </span>
                  </label>
                  <label>
                    Publication date
                    <input
                      type="date"
                      value={post.snapshot.date.slice(0, 10)}
                      onChange={(e) => {
                        if (e.target.value)
                          update({
                            date: new Date(
                              `${e.target.value}T12:00:00`,
                            ).toISOString(),
                          })
                      }}
                    />
                  </label>
                  <label>
                    Tags
                    <input
                      value={post.snapshot.tags.join(", ")}
                      onChange={(e) =>
                        update({
                          tags: e.target.value
                            .split(",")
                            .map((tag) => tag.trimStart()),
                        })
                      }
                      placeholder="Film, technology, life"
                    />
                    <span>Separate with commas.</span>
                  </label>
                  <label>
                    Project or series
                    <input
                      value={post.snapshot.project}
                      onChange={(e) => update({ project: e.target.value })}
                      placeholder="Creative Chaos"
                    />
                  </label>
                  {post.snapshot.cover && (
                    <label>
                      Cover description
                      <input
                        value={post.snapshot.coverAlt}
                        onChange={(e) => update({ coverAlt: e.target.value })}
                      />
                    </label>
                  )}
                </div>
                <div className="cms-inspector-section">
                  <h3>Elsewhere</h3>
                  <button
                    className="cms-row-link"
                    onClick={() => setPanel("social")}
                  >
                    <Share2 size={16} />{" "}
                    {post.snapshot.variants.length
                      ? `${post.snapshot.variants.length} social versions`
                      : "Prepare a social version"}
                    <ArrowUpRight size={15} />
                  </button>
                  <button
                    className="cms-row-link"
                    onClick={() => setPanel("email")}
                  >
                    <Send size={16} /> Prepare an email edition
                    <ArrowUpRight size={15} />
                  </button>
                </div>
                {post.canonical_path && post.published_revision && (
                  <a
                    className="cms-row-link"
                    href={post.canonical_path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View published post
                    <ArrowUpRight size={16} />
                  </a>
                )}
                <div className="cms-inspector-section">
                  <button
                    className="cms-button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !post.archived_at &&
                        !window.confirm(
                          "Archive this post? It will be removed from the website. Your writing and revisions remain available.",
                        )
                      )
                        return
                      void operation(async (saved) => {
                        const result = await api<Post>(
                          `/admin/posts/${saved.id}/archive`,
                          {
                            method: "POST",
                            body: {
                              version: saved.version,
                              archived: !saved.archived_at,
                            },
                          },
                        )
                        draft.acceptServer(result)
                        setNotice(
                          result.archived_at
                            ? "Post archived. You can restore it here."
                            : "Restored as a draft. Publish when ready.",
                        )
                      })
                    }}
                  >
                    {post.archived_at ? "Restore draft" : "Archive post"}
                  </button>
                </div>
              </div>
            )}
            {panel === "social" && (
              <SocialPanel
                snapshot={post.snapshot}
                revision={post.content_revision}
                update={update}
                notify={setNotice}
              />
            )}
            {panel === "email" && (
              <div className="cms-inspector-body">
                <h2>Email edition</h2>
                <p className="cms-muted">
                  Prepare the newsletter alongside your original.
                </p>
                <div className="cms-fields">
                  <label>
                    Subject
                    <input
                      value={post.snapshot.newsletter.subject}
                      placeholder={post.snapshot.title || "Your email subject"}
                      onChange={(e) =>
                        update({
                          newsletter: {
                            ...post.snapshot.newsletter,
                            subject: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    Preview text
                    <input
                      value={post.snapshot.newsletter.preview}
                      onChange={(e) =>
                        update({
                          newsletter: {
                            ...post.snapshot.newsletter,
                            preview: e.target.value,
                          },
                        })
                      }
                    />
                    <span>The short line shown in an inbox.</span>
                  </label>
                  <label>
                    Introduction
                    <textarea
                      rows={6}
                      value={post.snapshot.newsletter.intro}
                      onChange={(e) =>
                        update({
                          newsletter: {
                            ...post.snapshot.newsletter,
                            intro: e.target.value,
                          },
                        })
                      }
                      placeholder="An optional note to readers…"
                    />
                  </label>
                </div>
                <button
                  className="cms-button"
                  disabled={busy}
                  onClick={() =>
                    void operation(async (saved) => {
                      setEmailPreview(
                        await api(`/admin/posts/${saved.id}/email-preview`, {
                          method: "POST",
                          body: { version: saved.version },
                        }),
                      )
                    })
                  }
                >
                  <Eye size={17} /> Preview email
                </button>
                <p className="cms-service-note">
                  Delivery is not connected yet. This edition is saved with your
                  post; publishing to the website will not send it.
                </p>
              </div>
            )}
            {panel === "history" && (
              <div className="cms-inspector-body">
                <h2>Version history</h2>
                <p className="cms-muted">
                  Earlier writing stays here. Restoring creates a new draft.
                </p>
                <button
                  className="cms-button"
                  onClick={() =>
                    void operation(async (saved) =>
                      setRevisions(
                        await api(`/admin/posts/${saved.id}/revisions`),
                      ),
                    )
                  }
                >
                  Save and refresh history
                </button>
                <div className="cms-revision-list">
                  {revisions.map((r) => (
                    <button
                      key={r.revision}
                      onClick={() =>
                        void api<Snapshot>(
                          `/admin/posts/${post.id}/revisions/${r.revision}`,
                        )
                          .then((snapshot) =>
                            setHistorical({ revision: r.revision, snapshot }),
                          )
                          .catch((e) => setOperationError(e.message))
                      }
                    >
                      <strong>
                        Version {r.revision}
                        {r.revision === post.published_revision
                          ? " · Published"
                          : ""}
                      </strong>
                      <span>{formatTime(r.created_at)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
      {media && (
        <MediaPicker
          initialFile={pasteFile}
          close={() => setMedia(false)}
          select={(asset, alt, caption) => {
            editor
              ?.chain()
              .focus()
              .insertContent({
                type: "image",
                attrs: { src: asset.url, alt, caption },
              })
              .run()
            setMedia(false)
          }}
        />
      )}
      {linkDialog && (
        <Modal
          title={linkDialog === "video" ? "Add a video" : "Add a link"}
          close={() => {
            setLinkDialog(null)
            setLinkError("")
          }}
        >
          <div className="cms-fields">
            <label>
              {linkDialog === "video" ? "YouTube video URL" : "Link URL"}
              <input
                autoFocus
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") insertLink()
                }}
                placeholder="https://"
              />
            </label>
          </div>
          {linkError && (
            <p className="cms-error" role="alert">
              {linkError}
            </p>
          )}
          <div className="cms-modal-actions">
            {linkDialog === "link" && (
              <button
                className="cms-button"
                onClick={() => {
                  editor?.chain().focus().unsetLink().run()
                  setLinkDialog(null)
                }}
              >
                Remove link
              </button>
            )}
            <button className="cms-button cms-primary" onClick={insertLink}>
              Insert {linkDialog}
            </button>
          </div>
        </Modal>
      )}
      {review && (
        <Modal
          title={
            post.published_revision
              ? "Update the website version"
              : "Publish to your website"
          }
          close={() => !busy && setReview(false)}
        >
          <div className="cms-publish-summary">
            <span>{post.snapshot.format}</span>
            <h3>{post.snapshot.title || "Untitled post"}</h3>
            <p>{post.canonical_path || `/writing/${post.snapshot.slug}`}</p>
          </div>
          <p>
            Readers will see this saved version. Your social versions and email
            edition stay separate.
          </p>
          {post.scheduled_at && (
            <div className="cms-banner">
              <p>
                Version {post.scheduled_revision} is scheduled for{" "}
                {formatTime(post.scheduled_at)}. Later edits do not change that
                scheduled version.
              </p>
              <button
                className="cms-button"
                onClick={() =>
                  void operation(async (saved) => {
                    draft.acceptServer(
                      await api(`/admin/posts/${saved.id}/schedule`, {
                        method: "POST",
                        body: { version: saved.version, at: null },
                      }),
                    )
                    setNotice("Schedule cancelled.")
                  })
                }
              >
                Cancel schedule
              </button>
            </div>
          )}
          <details className="cms-schedule">
            <summary>Publish later</summary>
            <label>
              Date and time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
              <input
                type="datetime-local"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              />
            </label>
            <button
              className="cms-button"
              disabled={busy || !schedule}
              onClick={() =>
                void operation(async (saved) => {
                  draft.acceptServer(
                    await api(`/admin/posts/${saved.id}/schedule`, {
                      method: "POST",
                      body: {
                        version: saved.version,
                        at: new Date(schedule).toISOString(),
                      },
                    }),
                  )
                  setReview(false)
                  setNotice(
                    "Publication scheduled. The saved version will go live at that time.",
                  )
                })
              }
            >
              Schedule this version
            </button>
          </details>
          {operationError && (
            <p className="cms-error" role="alert">
              {operationError}
            </p>
          )}
          <div className="cms-modal-actions">
            <button
              className="cms-button"
              disabled={busy}
              onClick={() => setReview(false)}
            >
              Keep writing
            </button>
            <button
              className="cms-button cms-primary"
              disabled={busy || !post.snapshot.title.trim()}
              onClick={() =>
                void operation(async (saved) => {
                  draft.acceptServer(
                    await api(`/admin/posts/${saved.id}/publish`, {
                      method: "POST",
                      body: { version: saved.version },
                    }),
                  )
                  setReview(false)
                  setNotice("Published to the website.")
                })
              }
            >
              {busy
                ? "Publishing…"
                : post.published_revision
                  ? "Update published version"
                  : "Publish now"}
            </button>
          </div>
        </Modal>
      )}
      {historical && (
        <Modal
          title={`Version ${historical.revision}`}
          close={() => setHistorical(null)}
          wide
        >
          <div className="cms-history-preview">
            <ArticleView snapshot={historical.snapshot} preview />
          </div>
          <div className="cms-modal-actions">
            <button className="cms-button" onClick={() => setHistorical(null)}>
              Close
            </button>
            <button
              className="cms-button cms-primary"
              disabled={busy}
              onClick={() =>
                void operation(async (saved) => {
                  const result = await api<Post>(
                    `/admin/posts/${saved.id}/restore`,
                    {
                      method: "POST",
                      body: {
                        version: saved.version,
                        revision: historical.revision,
                      },
                    },
                  )
                  draft.acceptServer(result)
                  editor?.commands.setContent(result.snapshot.document, {
                    emitUpdate: false,
                  })
                  setHistorical(null)
                  setNotice("Earlier version restored as a draft.")
                })
              }
            >
              Restore as draft
            </button>
          </div>
        </Modal>
      )}
      {emailPreview && (
        <Modal title="Email preview" close={() => setEmailPreview(null)} wide>
          <p>
            <strong>Subject:</strong> {emailPreview.subject}
          </p>
          <div className="cms-tabs">
            <button
              aria-pressed={!plainEmail}
              onClick={() => setPlainEmail(false)}
            >
              Email
            </button>
            <button
              aria-pressed={plainEmail}
              onClick={() => setPlainEmail(true)}
            >
              Plain text
            </button>
          </div>
          {plainEmail ? (
            <pre className="cms-email-text">{emailPreview.text}</pre>
          ) : (
            <iframe
              className="cms-email-preview"
              title="Newsletter email preview"
              sandbox=""
              srcDoc={emailPreview.html}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

function SocialPanel({
  snapshot,
  revision,
  update,
  notify,
}: {
  snapshot: Snapshot
  revision: number
  update: (value: Partial<Snapshot>) => void
  notify: (value: string) => void
}) {
  const [platform, setPlatform] =
    useState<SocialVariant["platform"]>("LinkedIn")
  function change(id: string, changes: Partial<SocialVariant>) {
    update({
      variants: snapshot.variants.map((v) =>
        v.id === id ? { ...v, ...changes } : v,
      ),
    })
  }
  return (
    <div className="cms-inspector-body">
      <h2>Social versions</h2>
      <p className="cms-muted">
        Adapt it here. Post it yourself, then link it back.
      </p>
      <div className="cms-social-add">
        <select
          aria-label="Social platform"
          value={platform}
          onChange={(e) =>
            setPlatform(e.target.value as SocialVariant["platform"])
          }
        >
          {["LinkedIn", "Twitter / X", "Instagram", "Substack"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <button
          className="cms-icon"
          aria-label="Add social version"
          onClick={() =>
            update({
              variants: [
                ...snapshot.variants,
                {
                  id: crypto.randomUUID(),
                  platform,
                  parts: [""],
                  url: "",
                  baseRevision: revision,
                },
              ],
            })
          }
        >
          <Plus size={18} />
        </button>
      </div>
      {!snapshot.variants.length && (
        <div className="cms-empty-small">
          <Share2 size={28} />
          <p>
            Your original lives on the website. Add a version for wherever else
            you want to share it.
          </p>
        </div>
      )}
      {snapshot.variants.map((variant) => (
        <section className="cms-social-version" key={variant.id}>
          <div className="cms-social-heading">
            <h3>{variant.platform}</h3>
            <button
              className="cms-icon"
              aria-label={`Remove ${variant.platform} version`}
              onClick={() => {
                if (
                  window.confirm(
                    "Remove this social version from the draft? Earlier revisions will still contain it.",
                  )
                )
                  update({
                    variants: snapshot.variants.filter(
                      (v) => v.id !== variant.id,
                    ),
                  })
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <span className="cms-muted">
            {variant.linked
              ? "Link saved"
              : variant.url
                ? "Enter the full post link for this platform"
                : "Draft version"}
          </span>
          {variant.baseRevision < revision && (
            <div className="cms-variant-stale">
              <p>Based on an earlier version of this post.</p>
              <button
                onClick={() => change(variant.id, { baseRevision: revision })}
              >
                Mark as reviewed
              </button>
            </div>
          )}
          {variant.parts.map((part, index) => (
            <div className="cms-thread-part" key={index}>
              <label>
                {variant.platform === "Twitter / X"
                  ? `Part ${index + 1}`
                  : "Post copy"}
                <textarea
                  rows={7}
                  value={part}
                  onChange={(e) =>
                    change(variant.id, {
                      parts: variant.parts.map((p, i) =>
                        i === index ? e.target.value : p,
                      ),
                    })
                  }
                  placeholder="Write the version you’ll share…"
                />
              </label>
              <div className="cms-part-actions">
                <span
                  className={
                    variant.platform === "Twitter / X" && part.length > 280
                      ? "cms-length-warning"
                      : ""
                  }
                >
                  {part.length} characters
                  {variant.platform === "Twitter / X"
                    ? " / 280 standard limit"
                    : ""}
                </span>
                {index > 0 && (
                  <button
                    className="cms-icon"
                    aria-label={`Move part ${index + 1} up`}
                    onClick={() => {
                      const parts = [...variant.parts]
                      ;[parts[index - 1], parts[index]] = [
                        parts[index],
                        parts[index - 1],
                      ]
                      change(variant.id, { parts })
                    }}
                  >
                    <ChevronUp size={15} />
                  </button>
                )}
                {index < variant.parts.length - 1 && (
                  <button
                    className="cms-icon"
                    aria-label={`Move part ${index + 1} down`}
                    onClick={() => {
                      const parts = [...variant.parts]
                      ;[parts[index + 1], parts[index]] = [
                        parts[index],
                        parts[index + 1],
                      ]
                      change(variant.id, { parts })
                    }}
                  >
                    <ChevronDown size={15} />
                  </button>
                )}
                {variant.parts.length > 1 && (
                  <button
                    className="cms-icon"
                    aria-label={`Remove part ${index + 1}`}
                    onClick={() =>
                      change(variant.id, {
                        parts: variant.parts.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="cms-social-actions">
            {variant.platform === "Twitter / X" && (
              <button
                className="cms-button"
                onClick={() =>
                  change(variant.id, { parts: [...variant.parts, ""] })
                }
              >
                <Plus size={15} /> Add part
              </button>
            )}
            <button
              className="cms-button"
              onClick={() =>
                void navigator.clipboard
                  .writeText(
                    variant.parts.length > 1
                      ? variant.parts
                          .map(
                            (part, i) =>
                              `${i + 1}/${variant.parts.length}\n${part}`,
                          )
                          .join("\n\n")
                      : variant.parts[0],
                  )
                  .then(() => notify("Social copy copied."))
                  .catch(() =>
                    notify(
                      "Clipboard unavailable. Select and copy the text above.",
                    ),
                  )
              }
            >
              <Copy size={15} /> Copy
            </button>
          </div>
          <label>
            Link to the social post
            <input
              type="url"
              value={variant.url}
              placeholder="Paste the link after posting"
              onChange={(e) => change(variant.id, { url: e.target.value })}
            />
          </label>
        </section>
      ))}
    </div>
  )
}
