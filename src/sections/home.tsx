import { useEffect, useRef } from "react"
import { m, useMotionValueEvent, useScroll, useTransform } from "framer-motion"
import type { MotionValue } from "framer-motion"

import { Section } from "@/components/section"

const MAC_IMAGE = `${import.meta.env.BASE_URL}media/figma-macintosh.svg`

const SCREEN_CENTER_X = 47.5
const SCREEN_CENTER_Y = 26.6
const SCREEN_RECT = {
  left: "25.82%",
  top: "11.72%",
  width: "43.29%",
  height: "29.76%",
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type HomeSectionProps = {
  transitionProgress: MotionValue<number>
}

export function HomeSection({ transitionProgress }: HomeSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  })
  const reduced = prefersReducedMotion()

  const taglineOpacity = useTransform(scrollYProgress, [0, 0.18], reduced ? [1, 1] : [1, 0])

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    transitionProgress.set(latest)
  })

  useEffect(() => {
    const latest = scrollYProgress.get()
    transitionProgress.set(latest)
  }, [scrollYProgress, transitionProgress])

  return (
    <Section
      id="home"
      label="Home"
      className="h-[280svh] snap-none overflow-visible"
      innerClassName="relative h-full w-full"
    >
      <div ref={ref} className="relative h-full w-full">
        <div className="sticky top-0 h-svh overflow-hidden">
          <h1 className="sr-only">Writing my story as you read it.</h1>

          <m.div
            style={{ opacity: taglineOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[18svh] z-10 flex justify-center px-6 text-center lg:hidden"
          >
            <p className="text-balance text-3xl font-light leading-tight text-foreground sm:text-4xl">
              Writing my <span className="font-medium">story</span> as you{" "}
              <span className="font-display">read</span> it.
            </p>
          </m.div>

          <m.p
            style={{ opacity: taglineOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute left-[10.35vw] top-[47.1svh] z-10 hidden -translate-y-1/2 whitespace-nowrap text-4xl font-light text-foreground lg:block xl:text-5xl"
          >
            Writing my <span className="font-medium">story</span>
          </m.p>
          <m.p
            style={{ opacity: taglineOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute right-[10.8vw] top-[47.1svh] z-10 hidden -translate-y-1/2 whitespace-nowrap text-4xl font-light text-foreground lg:block xl:text-5xl"
          >
            as you <span className="font-display">read</span> it.
          </m.p>

          <m.div
            style={{ opacity: taglineOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[12svh] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-foreground/40" />
            <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-muted-foreground">
              scroll
            </span>
          </m.div>

          <div
            data-mac-scene
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            <m.div
              style={{
                transformOrigin: `${SCREEN_CENTER_X}% ${SCREEN_CENTER_Y}%`,
              }}
              data-mac-frame
              className="relative w-[min(74vw,360px)] sm:w-[min(52vw,430px)] lg:w-[30.25vw] lg:max-w-[533px]"
            >
              <div
                data-mac-screen
                style={{
                  left: SCREEN_RECT.left,
                  top: SCREEN_RECT.top,
                  width: SCREEN_RECT.width,
                  height: SCREEN_RECT.height,
                }}
                className="absolute z-30 overflow-hidden rounded-[2.5%]"
              >
                <MacScreenEffect />
              </div>

              <m.img
                data-mac-shell
                src={MAC_IMAGE}
                alt=""
                draggable={false}
                className="relative z-20 block aspect-[522.54/511.434] w-full select-none"
              />
            </m.div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function MacScreenEffect() {
  return (
    <div
      aria-hidden="true"
      className="mac-screen-effect pointer-events-none absolute inset-0 z-40"
    >
      <span className="mac-screen-glare" />
      <span className="mac-screen-noise" />
    </div>
  )
}
