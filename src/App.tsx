import { lazy, Suspense } from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation } from "framer-motion"

import { SiteShell } from "@/components/site-shell"

const HomePage = lazy(() => import("@/pages/home"))
const WorkPage = lazy(() => import("@/pages/work"))
const WritingPage = lazy(() => import("@/pages/writing"))
const PostPage = lazy(() => import("@/pages/post"))
const AboutPage = lazy(() => import("@/pages/about"))
const NotFoundPage = lazy(() => import("@/pages/not-found"))

function RouteFallback() {
  return (
    <div className="mx-auto grid min-h-[60svh] max-w-7xl place-items-center px-5 py-16 sm:px-8">
      <div className="size-10 animate-pulse rounded-full bg-foreground" aria-label="Loading" />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence mode="wait">
          <Suspense fallback={<RouteFallback />}>
            <Routes location={location} key={location.pathname}>
              <Route element={<SiteShell />}>
                <Route index element={<HomePage />} />
                <Route path="work" element={<WorkPage />} />
                <Route path="writing" element={<WritingPage />} />
                <Route path="writing/:slug" element={<PostPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  )
}
