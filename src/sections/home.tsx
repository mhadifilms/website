import { useEffect, useState } from "react"
import { m, useScroll, useTransform } from "framer-motion"

import { MAC_SCREEN_RECT } from "@/components/macintosh-constants"
import { MacintoshHero } from "@/components/macintosh-hero"
import { PortraitPlaceholder } from "@/components/portrait-placeholder"
import { Section } from "@/components/section"

const HERO_IMAGE = `${import.meta.env.BASE_URL}media/mhadi-camera.png`
const SCREEN_CENTER_X = (MAC_SCREEN_RECT.x + MAC_SCREEN_RECT.width / 2) * 100
const SCREEN_CENTER_Y = (MAC_SCREEN_RECT.y + MAC_SCREEN_RECT.height / 2) * 100

function useViewportHeight(): number {
  const [vh, setVh] = useState<number>(() =>
    typeof window === "undefined" ? 1 : window.innerHeight,
  )
  useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener("resize", onResize)
    window.addEventListener("orientationchange", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
    }
  }, [])
  return vh
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function HomeSection() {
  const { scrollY } = useScroll()
  const viewportHeight = useViewportHeight()
  const reduced = prefersReducedMotion()

  // Window scroll progress relative to one viewport — when the user has
  // scrolled a single viewport's worth, the zoom is finished and About fills
  // the screen.
  const progress = useTransform(scrollY, (y) =>
    Math.max(0, Math.min(1, y / Math.max(viewportHeight, 1))),
  )

  const scale = useTransform(progress, [0, 1], reduced ? [1, 1] : [1, 7])
  const caseOpacity = useTransform(progress, [0.25, 0.55], reduced ? [1, 1] : [1, 0])
  const imageOpacity = useTransform(progress, [0.4, 0.85], reduced ? [1, 1] : [1, 0])
  const taglineOpacity = useTransform(progress, [0, 0.18], reduced ? [1, 1] : [1, 0])
  const wrapperOpacity = useTransform(progress, [0.9, 1], reduced ? [1, 1] : [1, 0])

  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    const probe = new Image()
    probe.src = HERO_IMAGE
    probe.onload = () => {
      if (!cancelled) setImageFailed(false)
    }
    probe.onerror = () => {
      if (!cancelled) setImageFailed(true)
    }
    return () => {
      cancelled = true
      probe.onload = null
      probe.onerror = null
    }
  }, [])

  return (
    <Section
      id="home"
      label="Home"
      className="h-svh overflow-hidden"
      innerClassName="relative flex h-svh w-full items-center justify-center"
    >
      <h1 className="sr-only">Writing my story as you read it</h1>

      <m.div
        style={{ opacity: taglineOpacity }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[10svh] z-30 flex justify-center px-6 text-center lg:hidden"
      >
        <p className="text-balance text-3xl font-light leading-tight text-foreground sm:text-4xl">
          Writing my <span className="font-medium">story</span> as you{" "}
          <span className="font-display italic">read</span> it
        </p>
      </m.div>

      <m.p
        style={{ opacity: taglineOpacity }}
        aria-hidden="true"
        className="pointer-events-none absolute left-[3vw] top-1/2 z-30 hidden -translate-y-1/2 whitespace-nowrap text-4xl font-light text-foreground lg:block xl:left-[5vw] xl:text-5xl 2xl:text-[56px]"
      >
        Writing my <span className="font-medium">story</span>
      </m.p>
      <m.p
        style={{ opacity: taglineOpacity }}
        aria-hidden="true"
        className="pointer-events-none absolute right-[3vw] top-1/2 z-30 hidden -translate-y-1/2 whitespace-nowrap text-4xl font-light text-foreground lg:block xl:right-[5vw] xl:text-5xl 2xl:text-[56px]"
      >
        as you <span className="font-display italic">read</span> it
      </m.p>

      <m.div
        style={{ opacity: taglineOpacity }}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[12svh] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/40" />
        <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-muted-foreground">
          scroll
        </span>
      </m.div>

      <m.div
        aria-hidden="true"
        style={{ opacity: wrapperOpacity }}
        className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center"
      >
        <m.div
          style={{
            scale,
            transformOrigin: `${SCREEN_CENTER_X}% ${SCREEN_CENTER_Y}%`,
          }}
          className="relative w-[min(70vw,360px)] sm:w-[min(55vw,420px)] md:w-[min(48vw,460px)] lg:w-[min(32vw,500px)] xl:w-[min(28vw,520px)]"
        >
          <m.div
            style={{
              opacity: imageOpacity,
              left: `${MAC_SCREEN_RECT.x * 100}%`,
              top: `${MAC_SCREEN_RECT.y * 100}%`,
              width: `${MAC_SCREEN_RECT.width * 100}%`,
              height: `${MAC_SCREEN_RECT.height * 100}%`,
              borderRadius: "calc(16 / 533 * 100%)",
            }}
            className="pointer-events-none absolute overflow-hidden"
          >
            {imageFailed ? (
              <PortraitPlaceholder />
            ) : (
              <img
                src={HERO_IMAGE}
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                className="block h-full w-full object-cover grayscale contrast-[1.05]"
                onError={() => setImageFailed(true)}
              />
            )}
          </m.div>

          <m.div style={{ opacity: caseOpacity }} className="relative">
            <MacintoshHero ariaLabel="A vintage Macintosh framing a portrait" />
          </m.div>
        </m.div>
      </m.div>
    </Section>
  )
}
