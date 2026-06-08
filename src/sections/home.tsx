import { useEffect, useRef, useState } from "react"
import { m, useScroll, useTransform } from "framer-motion"
import type { MotionValue } from "framer-motion"

import { Section } from "@/components/section"
import { ScrollWorkCta } from "@/components/scroll-work-cta"
import { site } from "@/content/generated"
import { scenePolaroids } from "@/lib/polaroid-scene"

const MAC_IMAGE = `${import.meta.env.BASE_URL}media/figma-macintosh.svg`
const HERO_IMAGE = `${import.meta.env.BASE_URL}media/figma-mhadi-camera.png`
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
    offset: ["start start", "end end"],
  })
  const reduced = prefersReducedMotion()
  const bioParagraphs = site.bio.split(/\n+/).map((p) => p.trim()).filter(Boolean)

  const scale = useTransform(scrollYProgress, [0, 0.62, 1], reduced ? [1, 1, 1] : [1, 9.2, 9.2])
  const shellOpacity = useTransform(scrollYProgress, [0.6, 0.74], reduced ? [1, 1] : [1, 0])
  const screenGridOpacity = useTransform(scrollYProgress, [0.12, 0.24], [0, 1])
  const heroFrameOpacity = useTransform(scrollYProgress, [0.08, 0.18], [0, 1])
  const heroWidth = useTransform(scrollYProgress, [0, 0.22, 0.44, 0.78], reduced ? ["16%", "16%", "16%", "16%"] : ["100%", "34%", "16%", "11.5%"])
  const heroHeight = useTransform(scrollYProgress, [0, 0.22, 0.44, 0.78], reduced ? ["28%", "28%", "28%", "28%"] : ["100%", "50%", "28%", "20%"])
  const heroTop = useTransform(scrollYProgress, [0, 0.22, 0.78], reduced ? ["31%", "31%", "31%"] : ["0%", "24%", "27.8%"])
  const heroLeft = useTransform(scrollYProgress, [0, 0.22], reduced ? ["50%", "50%"] : ["0%", "50%"])
  const heroX = useTransform(scrollYProgress, [0, 0.22], reduced ? ["-50%", "-50%"] : ["0%", "-50%"])
  const heroRotate = useTransform(scrollYProgress, [0.14, 0.44, 0.78], reduced ? [-4, -4, -4] : [0, -3.2, -4.5])
  const heroPhotoInset = useTransform(scrollYProgress, [0.08, 0.22], ["0%", "5%"])
  const heroPhotoBottomInset = useTransform(scrollYProgress, [0.08, 0.22], ["0%", "18%"])
  const supportingPolaroidOpacity = useTransform(scrollYProgress, [0.14, 0.24], [0, 1])
  const supportingPolaroidY = useTransform(scrollYProgress, [0.14, 0.24], ["7%", "0%"])
  const aboutScale = useTransform(scrollYProgress, [0.5, 0.94], reduced ? [1, 1] : [1.08, 1])
  const aboutLineOpacity = useTransform(scrollYProgress, [0.14, 0.24], [0, 1])
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
      className="h-[320svh] snap-none overflow-visible"
      innerClassName="relative h-full w-full"
    >
      <div ref={ref} className="relative h-full w-full">
        <div className="sticky top-0 h-svh overflow-hidden">
          <h1 className="sr-only">Writing my story as you read it</h1>

          <m.div
            style={{ opacity: taglineOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[18svh] z-10 flex justify-center px-6 text-center lg:hidden"
          >
            <p className="text-balance text-3xl font-light leading-tight text-foreground sm:text-4xl">
              Writing my <span className="font-medium">story</span> as you{" "}
              <span className="font-display italic">read</span> it
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
            as you <span className="font-display italic">read</span> it
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
                  left: SCREEN_RECT.left,
                  top: SCREEN_RECT.top,
                  width: SCREEN_RECT.width,
                  height: SCREEN_RECT.height,
                }}
                className="pointer-events-none absolute z-30 overflow-hidden rounded-[2.5%] bg-background"
              >
                <m.div
                  style={{
                    scale: aboutScale,
                    transformOrigin: "50% 43%",
                  }}
                  className="absolute inset-0 z-20 bg-background text-foreground"
                >
                  <AboutInsideMac
                    polaroids={scenePolaroids}
                    paragraphs={bioParagraphs}
                    imageFailed={imageFailed}
                    onImageError={() => setImageFailed(true)}
                    gridOpacity={screenGridOpacity}
                    lineOpacity={aboutLineOpacity}
                    supportingPolaroidOpacity={supportingPolaroidOpacity}
                    supportingPolaroidY={supportingPolaroidY}
                    heroMorph={{
                      width: heroWidth,
                      height: heroHeight,
                      top: heroTop,
                      left: heroLeft,
                      x: heroX,
                      rotate: heroRotate,
                      frameOpacity: heroFrameOpacity,
                      photoInset: heroPhotoInset,
                      photoBottomInset: heroPhotoBottomInset,
                    }}
                  />
                </m.div>
                <MacScreenEffect />
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
  imageFailed: boolean
  onImageError: () => void
  gridOpacity: MotionValue<number>
  lineOpacity: MotionValue<number>
  supportingPolaroidOpacity: MotionValue<number>
  supportingPolaroidY: MotionValue<string>
  heroMorph: HeroMorphStyle
}

type HeroMorphStyle = {
  width: MotionValue<string>
  height: MotionValue<string>
  top: MotionValue<string>
  left: MotionValue<string>
  x: MotionValue<string>
  rotate: MotionValue<number>
  frameOpacity: MotionValue<number>
  photoInset: MotionValue<string>
  photoBottomInset: MotionValue<string>
}

function AboutInsideMac({
  polaroids,
  paragraphs,
  imageFailed,
  onImageError,
  gridOpacity,
  lineOpacity,
  supportingPolaroidOpacity,
  supportingPolaroidY,
  heroMorph,
}: AboutInsideMacProps) {
  const slots = [0, 1, 2].map((index) => polaroids[index % Math.max(polaroids.length, 1)])

  return (
    <div className="relative size-full overflow-hidden">
      <m.div
        aria-hidden="true"
        style={{
          opacity: gridOpacity,
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "4.67% 7.22%",
        }}
        className="absolute inset-0"
      />

      <m.svg
        style={{ opacity: lineOpacity }}
        viewBox="0 0 1627 36"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute left-[2.2%] top-[23.2%] h-[3.1%] w-[94.2%]"
      >
        <path
          d="M1 1 C370 35 1257 35 1626 1"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeOpacity="0.78"
        />
      </m.svg>

      <MorphingHeroPolaroid
        imageFailed={imageFailed}
        onImageError={onImageError}
        morph={heroMorph}
      />

      {slots.map((polaroid, index) => (
        <HangingScreenPolaroid
          key={`${polaroid?.src ?? "missing"}-${index}`}
          src={polaroid?.src}
          className={[
            index === 0 ? "left-[32.8%] top-[31.6%] w-[11.5%]" : "",
            index === 1 ? "right-[24.4%] top-[31.4%] w-[11.2%]" : "",
            index === 2 ? "right-[12%] top-[28.8%] w-[11.8%]" : "",
          ].join(" ")}
          baseRotate={index === 0 ? 4 : index === 1 ? -3 : 5}
          delay={index * 0.35}
          style={{ opacity: supportingPolaroidOpacity, y: supportingPolaroidY }}
        />
      ))}

      <div
        className="absolute left-1/2 top-[70%] z-10 flex w-[36%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
      >
        <h2 className="text-[4.6px] font-normal leading-none">
          <span aria-hidden="true" className="mr-[0.18em]">👋</span>
          Hey, I&apos;m <span className="font-display font-semibold">{site.shortName ?? site.name}</span>
        </h2>
        <div className="mt-[4.2%] space-y-[3%] text-[1.65px] font-light leading-[1.32]">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <ScrollWorkCta variant="mac" className="mt-[5%]" />
      </div>
    </div>
  )
}

type MorphingHeroPolaroidProps = {
  imageFailed: boolean
  onImageError: () => void
  morph: HeroMorphStyle
}

function MorphingHeroPolaroid({ imageFailed, onImageError, morph }: MorphingHeroPolaroidProps) {
  return (
    <m.figure
      aria-hidden="true"
      style={{
        width: morph.width,
        height: morph.height,
        top: morph.top,
        left: morph.left,
        x: morph.x,
        rotate: morph.rotate,
      }}
      className="absolute z-20 origin-top overflow-visible"
    >
      <m.span
        style={{ opacity: morph.frameOpacity }}
        className="absolute left-1/2 top-[-14%] h-[16%] w-px -translate-x-1/2 bg-accent/70"
      />
      <m.span
        style={{ opacity: morph.frameOpacity }}
        className="absolute left-1/2 top-[-16%] size-[2.8%] -translate-x-1/2 rounded-full bg-accent"
      />
      <m.div
        style={{ opacity: morph.frameOpacity }}
        className="absolute inset-0 bg-[#efede2] shadow-polaroid"
      />
      <m.div
        style={{
          top: morph.photoInset,
          right: morph.photoInset,
          bottom: morph.photoBottomInset,
          left: morph.photoInset,
        }}
        className="absolute overflow-hidden bg-muted"
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
            className="block size-full object-cover grayscale contrast-[1.08]"
            onError={onImageError}
          />
        )}
      </m.div>
    </m.figure>
  )
}

type HangingScreenPolaroidProps = {
  src?: string
  className: string
  baseRotate: number
  delay?: number
  style?: {
    opacity?: MotionValue<number>
    scale?: MotionValue<number>
    y?: MotionValue<string>
  }
}

function HangingScreenPolaroid({
  src,
  className,
  baseRotate,
  delay = 0,
  style,
}: HangingScreenPolaroidProps) {
  return (
    <m.div
      aria-hidden="true"
      style={style}
      className={`absolute z-20 ${className}`}
    >
      <m.figure
      animate={{
        rotate: [baseRotate - 0.7, baseRotate + 0.9, baseRotate - 0.4],
        y: [0, -0.25, 0.18],
      }}
      transition={{
        duration: 4.5 + delay,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
        delay,
      }}
      className="relative origin-top"
    >
      <span className="absolute left-1/2 top-[-17%] h-[19%] w-px -translate-x-1/2 bg-accent/70" />
      <span className="absolute left-1/2 top-[-19%] size-[3%] -translate-x-1/2 rounded-full bg-accent" />
      <div className="relative aspect-[188/254] bg-[#efede2] p-[5%] pb-[18%] shadow-polaroid">
        {src ? (
          <img
            src={src}
            alt=""
            className="block size-full object-cover saturate-[0.88] contrast-[0.96] sepia-[0.08]"
          />
        ) : (
          <div className="size-full bg-[#d9d9d9]" />
        )}
      </div>
      </m.figure>
    </m.div>
  )
}

function MacScreenEffect() {
  return (
    <div aria-hidden="true" className="mac-screen-effect absolute inset-0 z-40 pointer-events-none">
      <span className="mac-screen-glare" />
      <span className="mac-screen-noise" />
    </div>
  )
}
