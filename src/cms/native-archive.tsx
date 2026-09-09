import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import LegacyArchive from "@/pages/archive-entry"
import { api, ApiError } from "./api"
import type { PublicPost } from "./types"
import { ArticleView } from "./article-view"
import { applyPageMeta } from "@/lib/seo"
export default function NativeArchive() {
  const { pathname } = useLocation()
  const [result, setResult] = useState<{
    path: string
    post?: PublicPost
    withdrawn?: boolean
  } | null>(null)
  useEffect(() => {
    let active = true
    api<PublicPost>(`/public/post?path=${encodeURIComponent(pathname)}`)
      .then((post) => {
        if (active) setResult({ path: pathname, post })
      })
      .catch((error) => {
        if (active)
          setResult({
            path: pathname,
            withdrawn: error instanceof ApiError && error.status === 410,
          })
      })
    return () => {
      active = false
    }
  }, [pathname])
  useEffect(() => {
    if (result?.post)
      applyPageMeta({
        title: `${result.post.snapshot.title} | M Hadi`,
        description: result.post.snapshot.subtitle,
        canonicalPath: result.path,
      })
  }, [result])
  if (!result || result.path !== pathname)
    return <div className="cms-loading">Opening article…</div>
  if (result.post)
    return (
      <main className="native-writing-page">
        <nav>
          <Link to="/archives">
            <ArrowLeft size={16} /> Archives
          </Link>
          <Link to="/writing">Creative Chaos</Link>
        </nav>
        <ArticleView snapshot={result.post.snapshot} />
      </main>
    )
  if (result.withdrawn)
    return (
      <main className="cms-empty">
        <h1>This article is no longer published.</h1>
        <Link to="/writing">Browse more writing</Link>
      </main>
    )
  return <LegacyArchive />
}
