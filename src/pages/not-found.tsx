import { useEffect, useRef, useState } from "react"
import type { CSSProperties, MouseEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useNativeArchives } from "@/cms/use-native-archives"
import { archiveEntryPath } from "@/lib/archive-utils"
import { applyPageMeta } from "@/lib/seo"
import "./not-found.css"

const DISKS = [
  { id: "home", label: "Home", path: "/" },
  { id: "archives", label: "Archives", path: "/archives" },
  { id: "random", label: "Random", path: "/archives" },
] as const
type DiskId = typeof DISKS[number]["id"]
const DRAG_TYPE = "application/x-mhadi-disk"

function Screen({ disk, path, inserting }: { disk: DiskId | null; path: string; inserting: boolean }) {
  const label = DISKS.find(item => item.id === disk)?.label
  return <div className="lost-screen" data-preview={disk || undefined} aria-hidden="true">
    <div className="lost-screen-symbol">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {!disk && <>
          <path d="M15 8h23l12 12v36H15V8Z M38 8v13h12" />
          <path className="lost-file-edge" d="M9 22v37a3 3 0 0 0 3 3h26" />
        </>}
        {disk === "home" && <path d="m9 30 23-20 23 20M15 25v29h13V38h9v16h12V25" />}
        {disk === "archives" && <>
          <path d="M9 25v-9a3 3 0 0 1 3-3h16l6 7h18a3 3 0 0 1 3 3v5M9 27h46l-6 25H15L9 27Z" />
          <path d="M19 35h24" />
        </>}
        {disk === "random" && <path d="M10 18h7c12 0 18 28 30 28h7m-8-8 8 8-8 8M10 46h7c5 0 9-5 13-12m5-10c4-4 7-6 12-6h7m-8-8 8 8-8 8" />}
      </svg>
      {!disk && <span className="lost-screen-code">404</span>}
    </div>
    <p className="lost-screen-title">{inserting ? `Opening ${label}…` : label || "Page not found"}</p>
    <p className="lost-screen-detail">{path}</p>
    {inserting && <span className="lost-screen-progress"><span /></span>}
  </div>
}

export default function NotFoundPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const entries = useNativeArchives()
  // Legacy writing can have been withdrawn from the publishing manifest. Only
  // native published writing and public non-writing archives enter this pool.
  const candidates = entries.filter(item => !item.unlisted && (item.category !== "Writings" || item.nativePath))
  const [randomSeed] = useState(() => Math.random())
  const randomPath = candidates.length ? archiveEntryPath(candidates[Math.floor(randomSeed * candidates.length)]) : "/archives"
  const [inserting, setInserting] = useState<DiskId | null>(null)
  const [dragging, setDragging] = useState<DiskId | null>(null)
  const [hovered, setHovered] = useState<DiskId | null>(null)
  const [focused, setFocused] = useState<DiskId | null>(null)
  const [overDrive, setOverDrive] = useState(false)
  const [insertionStyle, setInsertionStyle] = useState<CSSProperties>({})
  const drive = useRef<HTMLDivElement>(null)
  const links = useRef<Partial<Record<DiskId, HTMLAnchorElement | null>>>({})
  const heading = useRef<HTMLHeadingElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busy = useRef(false)
  const preview = inserting || dragging || hovered || focused
  const previewPath = preview === "random" ? randomPath : preview ? DISKS.find(disk => disk.id === preview)!.path : location.pathname

  useEffect(() => {
    applyPageMeta({
      title: "Page not found | M Hadi",
      description: "This page could not be found. Choose Home, Archives, or a random piece from the archive.",
      canonicalPath: location.pathname,
      noindex: true,
    })
    window.scrollTo({ top: 0, behavior: "instant" })
    heading.current?.focus({ preventScroll: true })
    return () => {
      if (timer.current) clearTimeout(timer.current)
      busy.current = false
    }
  }, [location.pathname])

  function insertDisk(id: DiskId) {
    if (busy.current) return
    const path = id === "random" ? randomPath : DISKS.find(disk => disk.id === id)!.path
    busy.current = true
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate(path)
      return
    }
    const from = links.current[id]?.getBoundingClientRect()
    const to = drive.current?.getBoundingClientRect()
    if (from && to) setInsertionStyle({
      "--insert-x": `${to.left + to.width / 2 - from.left - from.width / 2}px`,
      "--insert-y": `${to.top + to.height / 2 - from.top - from.height / 2}px`,
    } as CSSProperties)
    setInserting(id)
    setDragging(null)
    setOverDrive(false)
    timer.current = setTimeout(() => navigate(path), 440)
  }

  function activate(event: MouseEvent<HTMLAnchorElement>, id: DiskId) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    insertDisk(id)
  }

  return <main id="content" className="lost-page" data-not-found data-inserting={inserting || undefined}>
    <h1 className="sr-only" ref={heading} tabIndex={-1}>404 — Page not found</h1>
    <header className="lost-header">
      <Link className="lost-wordmark" to="/">M Hadi</Link>
    </header>

    <div className="lost-desk">
      <div className="lost-computer">
        <img className="lost-mac" src={`${import.meta.env.BASE_URL}media/figma-macintosh.svg`} alt="" width="523" height="511" draggable={false} fetchPriority="high" />
        <Screen disk={preview} path={previewPath} inserting={Boolean(inserting)} />
        <div
          ref={drive}
          className="lost-drive"
          data-drive
          data-ready={overDrive || undefined}
          aria-hidden="true"
          onDragOver={event => {
            if (!dragging || !event.dataTransfer.types.includes(DRAG_TYPE)) return
            event.preventDefault()
            event.dataTransfer.dropEffect = "link"
            setOverDrive(true)
          }}
          onDragLeave={() => setOverDrive(false)}
          onDrop={event => {
            event.preventDefault()
            const id = event.dataTransfer.getData(DRAG_TYPE)
            if (dragging && id === dragging) insertDisk(dragging)
            setOverDrive(false)
          }}
        />
      </div>

      <nav className="lost-disks" aria-label="Choose a disk">
        {DISKS.map(disk => <Link
          key={disk.id}
          ref={element => { links.current[disk.id] = element }}
          to={disk.id === "random" ? randomPath : disk.path}
          className={`lost-disk lost-disk-${disk.id}`}
          data-disk={disk.id}
          data-inserting={inserting === disk.id || undefined}
          data-dragging={dragging === disk.id || undefined}
          style={inserting === disk.id ? insertionStyle : undefined}
          draggable={!inserting}
          onClick={event => activate(event, disk.id)}
          onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(disk.id) }}
          onPointerLeave={() => setHovered(null)}
          onFocus={() => setFocused(disk.id)}
          onBlur={() => setFocused(null)}
          onDragStart={event => {
            event.dataTransfer.setData(DRAG_TYPE, disk.id)
            event.dataTransfer.effectAllowed = "link"
            setDragging(disk.id)
          }}
          onDragEnd={() => { setDragging(null); setOverDrive(false) }}
        >
          <span className="lost-disk-shutter" aria-hidden="true" />
          <span className="lost-disk-label">{disk.label}</span>
          <span className="lost-disk-notch" aria-hidden="true" />
        </Link>)}
      </nav>
    </div>

    <footer className="lost-footer">
      <p className="lost-path" title={location.pathname}>{location.pathname}</p>
      <p className="lost-prompt" aria-live="polite">{inserting ? `Opening ${DISKS.find(disk => disk.id === inserting)?.label}…` : "Open a disk"}</p>
    </footer>
  </main>
}
