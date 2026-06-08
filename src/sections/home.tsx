import { useEffect, useRef, useState } from "react"
import { m, useScroll, useTransform } from "framer-motion"
import type { MotionValue } from "framer-motion"

import { Section } from "@/components/section"
import { site } from "@/content/generated"
import { scenePolaroids } from "@/lib/polaroid-scene"

const MAC_IMAGE = `${import.meta.env.BASE_URL}media/figma-macintosh.svg`
const HERO_IMAGE = scenePolaroids[0]?.src ?? `${import.meta.env.BASE_URL}media/figma-mhadi-camera.png`
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

export function HomeSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const reduced = prefersReducedMotion()
  const bioParagraphs = site.bio.split(/\n+/).map((p) => p.trim()).filter(Boolean)

  const scale = useTransform(scrollYProgress, [0, 0.58, 1], reduced ? [1, 1, 1] : [1, 5.2, 5.2])
  const shellOpacity = useTransform(scrollYProgress, [0.5, 0.68], reduced ? [1, 1] : [1, 0])
  const photoOpacity = useTransform(scrollYProgress, [0, 0.48, 0.64], reduced ? [1, 1, 1] : [1, 1, 0])
  const aboutOpacity = useTransform(scrollYProgress, [0.5, 0.68], [0, 1])
  const aboutScale = useTransform(scrollYProgress, [0.5, 0.9], reduced ? [1, 1] : [1.22, 1])
  const aboutTextOpacity = useTransform(scrollYProgress, [0.66, 0.86], [0, 1])
  const aboutLineOpacity = useTransform(scrollYProgress, [0.62, 0.78], [0, 1])
  const taglineOpacity = useTransform(scrollYProgress, [0, 0.18], reduced ? [1, 1] : [1, 0])

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
      className="h-[260svh] snap-none overflow-visible"
      innerClassName="relative h-full w-full"
    >
      <div ref={ref} className="relative h-full w-full">
        <div className="sticky top-0 h-svh overflow-hidden">
          <h1 className="sr-only">Writing my story as you read it</h1>

          <m.div
            style={{ opacity: taglineOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[18svh] z-30 flex justify-center px-6 text-center lg:hidden"
          >
            <p className="text-balance text-3xl font-light leading-tight text-foreground sm:text-4xl">
              Writing my <span className="font-medium">story</span> as you{" "}
              <span className="font-display italic">read</span> it
            </p>
          </m.div>

          <m.p
            style={{ opacity: taglineOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute left-[10.35vw] top-[47.1svh] z-30 hidden -translate-y-1/2 whitespace-nowrap text-4xl font-light text-foreground lg:block xl:text-5xl"
          >
            Writing my <span className="font-medium">story</span>
          </m.p>
          <m.p
            style={{ opacity: taglineOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute right-[10.8vw] top-[47.1svh] z-30 hidden -translate-y-1/2 whitespace-nowrap text-4xl font-light text-foreground lg:block xl:text-5xl"
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

          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <m.div
              style={{
                scale,
                transformOrigin: `${SCREEN_CENTER_X}% ${SCREEN_CENTER_Y}%`,
              }}
              className="relative w-[min(74vw,360px)] sm:w-[min(52vw,430px)] lg:w-[30.25vw] lg:max-w-[533px]"
            >
              <m.div
                style={{
                  opacity: photoOpacity,
                  left: SCREEN_RECT.left,
                  top: SCREEN_RECT.top,
                  width: SCREEN_RECT.width,
                  height: SCREEN_RECT.height,
                }}
                className="pointer-events-none absolute z-30 overflow-hidden rounded-[2.5%]"
              >
                {imageFailed ? (
                  <div className="size-full bg-muted" />
                ) : (
                  <img
                    src={HERO_IMAGE}
                    alt=""
                    aria-hidden="true"
                    loading="eager"
                    decoding="async"
                    className="block size-full object-cover grayscale contrast-[1.05]"
                    onError={() => setImageFailed(true)}
                  />
                )}
                <m.div
                  style={{
                    opacity: aboutOpacity,
                    scale: aboutScale,
                    transformOrigin: "9% 43%",
                  }}
                  className="absolute inset-0 bg-background text-foreground"
                >
                  <AboutInsideMac
                    polaroids={scenePolaroids}
                    paragraphs={bioParagraphs}
                    lineOpacity={aboutLineOpacity}
                    textOpacity={aboutTextOpacity}
                  />
                </m.div>
              </m.div>

              <m.img
                src={MAC_IMAGE}
                alt=""
                draggable={false}
                style={{ opacity: shellOpacity }}
                className="relative z-20 block aspect-[522.54/511.434] w-full select-none"
              />
            </m.div>
          </div>
        </div>
      </div>
    </Section>
  )
}

type AboutInsideMacProps = {
  polaroids: typeof scenePolaroids
  paragraphs: string[]
  lineOpacity: MotionValue<number>
  textOpacity: MotionValue<number>
}

function AboutInsideMac({ polaroids, paragraphs, lineOpacity, textOpacity }: AboutInsideMacProps) {
  const slots = [0, 1, 2, 3].map((index) => polaroids[index % Math.max(polaroids.length, 1)])

  return (
    <div className="relative size-full overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "4.67% 7.22%",
        }}
      />

      <m.svg
        style={{ opacity: lineOpacity }}
        viewBox="0 0 1627 36"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute left-[2.2%] top-[21.5%] h-[3.1%] w-[94.2%]"
      >
        <path
          d="M1 1 C370 35 1257 35 1626 1"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeOpacity="0.78"
        />
      </m.svg>

      {slots.map((polaroid, index) => (
        <figure
          key={`${polaroid?.src ?? "missing"}-${index}`}
          className={[
            "absolute aspect-[188/254] w-[10.9%] overflow-hidden bg-[#d9d9d9]",
            index === 0 ? "left-[3.6%] top-[28%]" : "",
            index === 1 ? "left-[18.4%] top-[31.9%]" : "",
            index === 2 ? "right-[13.2%] top-[29.7%]" : "",
            index === 3 ? "right-0 top-[26.7%]" : "",
          ].join(" ")}
        >
          {polaroid?.src && (
            <img
              src={polaroid.src}
              alt=""
              className="size-full object-cover saturate-[0.88] contrast-[0.96] sepia-[0.08]"
            />
          )}
        </figure>
      ))}

      <m.div
        style={{ opacity: textOpacity }}
        className="absolute left-1/2 top-1/2 flex w-[36.4%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
      >
        <h2 className="text-[10px] font-normal leading-none">
          <span aria-hidden="true" className="mr-[0.18em]">👋</span>
          Hey, I&apos;m <span className="font-display font-semibold">{site.shortName ?? site.name}</span>
        </h2>
        <div className="mt-[4.5%] space-y-[3.4%] text-[4.8px] font-light leading-[1.18]">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-[6%] flex h-[8.8%] w-[22.7%] flex-col items-center justify-center rounded-full bg-[#c0bca9]/20 text-[2.4px] leading-none text-black">
          <span className="font-light italic">scroll to see</span>
          <span>some of my work</span>
        </div>
      </m.div>
    </div>
  )
}
