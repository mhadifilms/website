import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion"

import { SiteShell } from "@/components/site-shell"

const SitePage = lazy(() => import("@/pages/site"))

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
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<SiteShell />}>
              <Route path="*" element={<SitePage />} />
            </Route>
          </Routes>
        </Suspense>
      </MotionConfig>
    </LazyMotion>
  )
}
