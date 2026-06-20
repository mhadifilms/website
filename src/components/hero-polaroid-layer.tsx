import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Flip } from "gsap/Flip"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { useSectionContext } from "@/hooks/section-context"
import { scenePolaroids } from "@/lib/polaroid-scene"

gsap.registerPlugin(Flip, ScrollTrigger, useGSAP)

const HERO_IMAGE = `${import.meta.env.BASE_URL}media/figma-mhadi-camera.png`
const POLAROID_COUNT = 5
const CENTER_POLAROID_INDEX = 2
const FINAL_ROTATIONS = [-6, 4, -3, -4, 6] as const
const POLAROID_TARGETS = ["home", "experiences", "experiences", "archives", "about"] as const
const POLAROID_LABELS = [
  "Return to the home section",
  "Jump to the experiences section",
  "Jump to the experiences section",
  "Jump to the archives section",
  "Return to the about section",
] as const

const SCREEN = {
  originX: 0.475,
  originY: 0.266,
}

type Rect = {
  left: number
  top: number
  width: number
  height: number
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function macScaleAt(progress: number) {
  if (progress >= 0.72) return 9.2
  return lerp(1, 9.2, clamp(progress / 0.72, 0, 1))
}

function elementRect(element: HTMLElement): Rect {
  const rect = element.getBoundingClientRect()

  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

function scaleRectFromOrigin(rect: Rect, origin: { x: number; y: number }, scale: number): Rect {
  return {
    left: origin.x + (rect.left - origin.x) * scale,
    top: origin.y + (rect.top - origin.y) * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  }
}

function screenRectAt(screen: Rect, progress: number): Rect {
  const origin = {
    x: screen.left + screen.width / 2,
    y: screen.top + screen.height / 2,
  }

  return scaleRectFromOrigin(screen, origin, macScaleAt(progress))
}

function polaroidInScreen(screen: Rect, shape: { width: number; height: number; top: number; x?: number }): Rect {
  const width = screen.width * shape.width
  const height = screen.height * shape.height

  return {
    left: screen.left + (screen.width - width) / 2 + screen.width * (shape.x ?? 0),
    top: screen.top + screen.height * shape.top,
    width,
    height,
  }
}

function markerRectAtScroll(marker: HTMLElement, scrollY: number): Rect {
  const rect = marker.getBoundingClientRect()
  const documentTop = rect.top + window.scrollY

  return {
    left: rect.left,
    top: documentTop - scrollY,
    width: rect.width,
    height: rect.height,
  }
}

function rectVars(rect: Rect): gsap.TweenVars {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

export function HeroPolaroidLayer() {
  const sectionContext = useSectionContext()
  const scopeRef = useRef<HTMLDivElement>(null)
  const heroRefs = useRef<Array<HTMLButtonElement | null>>([])
  const frameRefs = useRef<Array<HTMLDivElement | null>>([])
  const photoRefs = useRef<Array<HTMLDivElement | null>>([])
  const screenEffectRefs = useRef<Array<HTMLDivElement | null>>([])
  const [failedImages, setFailedImages] = useState<Set<number>>(() => new Set())
  const polaroids = useMemo(
    () =>
      Array.from({ length: POLAROID_COUNT }, (_, index) => {
        const fallback = { src: HERO_IMAGE, alt: "" }
        if (scenePolaroids.length === 0) return fallback
        return scenePolaroids[index % scenePolaroids.length] ?? fallback
      }),
    [],
  )

  const scrollToTarget = useCallback((index: number) => {
    const target = POLAROID_TARGETS[index] ?? "experiences"
    sectionContext?.scrollToId(target, {
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }, [sectionContext])

  useEffect(() => {
    let cancelled = false
    const probes = polaroids.map((polaroid, index) => {
      const probe = new Image()
      probe.src = polaroid.src
      probe.onload = () => {
        if (cancelled) return
        setFailedImages((current) => {
          if (!current.has(index)) return current
          const next = new Set(current)
          next.delete(index)
          return next
        })
      }
      probe.onerror = () => {
        if (cancelled) return
        setFailedImages((current) => new Set(current).add(index))
      }
      return probe
    })
    return () => {
      cancelled = true
      probes.forEach((probe) => {
        probe.onload = null
        probe.onerror = null
      })
    }
  }, [polaroids])

  useGSAP(
    () => {
      const home = document.getElementById("home")
      const about = document.getElementById("about")
      const macFrame = document.querySelector<HTMLElement>("[data-mac-frame]")
      const macScene = document.querySelector<HTMLElement>("[data-mac-scene]")
      const macShell = document.querySelector<HTMLElement>("[data-mac-shell]")
      const macScreen = document.querySelector<HTMLElement>("[data-mac-screen]")
      const macScreenEffect = document.querySelector<HTMLElement>("[data-mac-screen] .mac-screen-effect")
      const polaroidElements = Array.from({ length: POLAROID_COUNT }, (_, index) => ({
        hero: heroRefs.current[index],
        frame: frameRefs.current[index],
        photo: photoRefs.current[index],
        screenEffect: screenEffectRefs.current[index],
        marker: document.querySelector<HTMLElement>(`[data-hero-polaroid-marker='about-${index}']`),
        index,
      })).filter((item): item is {
        hero: HTMLButtonElement
        frame: HTMLDivElement
        photo: HTMLDivElement
        screenEffect: HTMLDivElement
        marker: HTMLElement
        index: number
      } => Boolean(item.hero && item.frame && item.photo && item.screenEffect && item.marker))

      if (!home || !about || !macFrame || !macScene || !macShell || !macScreen || !macScreenEffect || polaroidElements.length === 0) {
        return undefined
      }

      let timeline: gsap.core.Timeline | undefined
      let followTimeline: gsap.core.Timeline | undefined
      let resizeFrame = 0

      const buildTimeline = () => {
        timeline?.scrollTrigger?.kill()
        timeline?.kill()
        followTimeline?.scrollTrigger?.kill()
        followTimeline?.kill()
        const animatedNodes = polaroidElements.flatMap((item) => [item.hero, item.frame, item.photo, item.screenEffect])
        gsap.killTweensOf([...animatedNodes, macFrame, macScene, macShell, macScreenEffect])
        gsap.set(macFrame, { scale: 1, transformOrigin: `${SCREEN.originX * 100}% ${SCREEN.originY * 100}%` })

        const startScroll = home.offsetTop
        const endScroll = startScroll + home.offsetHeight - window.innerHeight
        const screenBase = elementRect(macScreen)
        const screenStart = screenRectAt(screenBase, 0)

        gsap.set(macScene, { opacity: 1 })
        gsap.set([macShell, macScreenEffect], { opacity: 1 })
        polaroidElements.forEach(({ hero, frame, photo, screenEffect }) => {
          gsap.set([screenEffect], { opacity: 1 })
          gsap.set(hero, {
            ...rectVars(screenStart),
            opacity: 0,
            rotate: 0,
            transformOrigin: "50% 0%",
          })
          gsap.set(frame, { opacity: 0 })
          gsap.set(photo, { top: 0, right: 0, bottom: 0, left: 0 })
        })

        const homeTimeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: home,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        timeline = homeTimeline

        homeTimeline
          .to(macFrame, { scale: 9.2, duration: 0.72 }, 0)
          .to(macShell, { opacity: 0, duration: 0.18 }, 0.58)
          .to([macScreenEffect, ...polaroidElements.map((item) => item.screenEffect)], { opacity: 0, duration: 0.18 }, 0.6)
          .to(macScene, { opacity: 0, duration: 0.08 }, 0.84)

        polaroidElements.forEach(({ hero, frame, photo, marker, index }) => {
          const offsetFromCenter = index - CENTER_POLAROID_INDEX
          const enterAt = 0.08 + index * 0.035
          const shrinkAt = 0.28 + index * 0.025
          const attachAt = 0.55 + Math.abs(offsetFromCenter) * 0.035
          const finalRotate = FINAL_ROTATIONS[index] ?? -3
          const screenPolaroid = polaroidInScreen(screenRectAt(screenBase, 0.22), {
            width: 0.3,
            height: 0.46,
            top: 0.23,
            x: offsetFromCenter * 0.072,
          })
          const screenSmall = polaroidInScreen(screenRectAt(screenBase, 0.58), {
            width: 0.115,
            height: 0.205,
            top: 0.31,
            x: offsetFromCenter * 0.036,
          })
          const aboutPolaroid = markerRectAtScroll(marker, endScroll)

          homeTimeline
            .to(hero, { opacity: 1, duration: 0.05 }, enterAt)
            .to(hero, { ...rectVars(screenPolaroid), rotate: finalRotate * 0.42, duration: 0.18, ease: "power1.inOut" }, enterAt)
            .to(frame, { opacity: 1, duration: 0.12 }, enterAt + 0.01)
            .to(photo, { top: "5%", right: "5%", bottom: "18%", left: "5%", duration: 0.12 }, enterAt + 0.01)
            .to(hero, { ...rectVars(screenSmall), rotate: finalRotate * 0.65, duration: 0.3 }, shrinkAt)
            .to(hero, { ...rectVars(aboutPolaroid), rotate: finalRotate, duration: 0.28, ease: "power1.inOut" }, attachAt)
        })

        const aboutTimeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: about,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        followTimeline = aboutTimeline

        polaroidElements.forEach(({ hero, marker, index }) => {
          const finalRotate = FINAL_ROTATIONS[index] ?? -3
          const aboutPolaroid = markerRectAtScroll(marker, endScroll)
          const aboutExitPolaroid = markerRectAtScroll(marker, endScroll + about.offsetHeight)

          aboutTimeline.fromTo(
            hero,
            { ...rectVars(aboutPolaroid), opacity: 1, rotate: finalRotate },
            { ...rectVars(aboutExitPolaroid), rotate: finalRotate, duration: 1, immediateRender: false },
            0,
          )
          aboutTimeline.to(hero, { opacity: 0, duration: 0.16 }, 0.84)
        })
      }

      const queueRebuild = () => {
        window.cancelAnimationFrame(resizeFrame)
        resizeFrame = window.requestAnimationFrame(() => {
          buildTimeline()
          ScrollTrigger.refresh()
        })
      }

      buildTimeline()
      window.addEventListener("resize", queueRebuild)
      document.fonts?.ready.then(queueRebuild).catch(() => undefined)

      return () => {
        window.cancelAnimationFrame(resizeFrame)
        window.removeEventListener("resize", queueRebuild)
        timeline?.scrollTrigger?.kill()
        timeline?.kill()
        followTimeline?.scrollTrigger?.kill()
        followTimeline?.kill()
      }
    },
    { scope: scopeRef },
  )

  return (
    <div ref={scopeRef} className="hero-entrance pointer-events-none fixed inset-0 z-30">
      {polaroids.map((polaroid, index) => (
        <button
          key={`${polaroid.src}-${index}`}
          ref={(node) => {
            heroRefs.current[index] = node
          }}
          type="button"
          aria-label={POLAROID_LABELS[index] ?? "Jump to the experiences section"}
          onClick={() => scrollToTarget(index)}
          className="pointer-events-auto fixed left-0 top-0 block cursor-crosshair overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <div
            ref={(node) => {
              frameRefs.current[index] = node
            }}
            aria-hidden="true"
            className="absolute inset-0 bg-[#efede2] shadow-polaroid"
          />
          <div
            ref={(node) => {
              photoRefs.current[index] = node
            }}
            className="absolute inset-0 overflow-hidden bg-muted"
          >
            {failedImages.has(index) ? (
              <div className="absolute inset-0 bg-muted" />
            ) : (
              <img
                src={polaroid.src}
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.08]"
                onError={() => setFailedImages((current) => new Set(current).add(index))}
              />
            )}
          </div>
          <div
            ref={(node) => {
              screenEffectRefs.current[index] = node
            }}
            aria-hidden="true"
            className="mac-screen-effect pointer-events-none absolute inset-0 z-40"
          >
            <span className="mac-screen-glare" />
            <span className="mac-screen-noise" />
          </div>
        </button>
      ))}
    </div>
  )
}
