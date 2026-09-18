import { ReadingNavigation } from "@/components/reading-navigation"
import { lazy, Suspense } from "react"
import { POST_REDIRECTS } from "../shared/post-redirects.js"
import { Navigate, Route, Routes } from "react-router-dom"
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion"

import { SiteShell } from "@/components/site-shell"
import { ARCHIVE_CATEGORY_ORDER, archiveCategorySlug } from "@/lib/archive-utils"

const WritingPage = lazy(() => import("@/cms/public"))

const SitePage = lazy(() => import("@/pages/site"))
const ArchiveEntryPage = lazy(() => import("@/cms/native-archive"))
const NotFoundPage = lazy(() => import("@/pages/not-found"))

function RouteFallback() {
  return (
    <div className="grid min-h-svh place-items-center bg-background">
      <div className="size-8 animate-pulse rounded-full bg-foreground/40" aria-label="Loading" />
    </div>
  )
}

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <ReadingNavigation />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {Object.entries(POST_REDIRECTS).map(([from, to]) => <Route key={from} path={from} element={<Navigate to={`${to}/`} replace />} />)}
            <Route path="/writing" element={<WritingPage />} />
            <Route path="/writing/:slug" element={<WritingPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route element={<SiteShell />}>
              <Route path="/archives/:categorySlug/:entrySlug" element={<ArchiveEntryPage />} />
              {["/", "/about", "/experiences", "/archives", ...ARCHIVE_CATEGORY_ORDER.map(category => `/archives/${archiveCategorySlug(category)}`)].map(path => (
                <Route key={path} path={path} element={<SitePage />} />
              ))}
            </Route>
          </Routes>
        </Suspense>
      </MotionConfig>
    </LazyMotion>
  )
}
