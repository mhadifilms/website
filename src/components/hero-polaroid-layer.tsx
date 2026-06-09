import { useCallback, useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Flip } from "gsap/Flip"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { useSectionContext } from "@/hooks/section-context"

gsap.registerPlugin(Flip, ScrollTrigger, useGSAP)

const HERO_IMAGE = `${import.meta.env.BASE_URL}media/figma-mhadi-camera.png`

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

function polaroidInScreen(screen: Rect, shape: { width: number; height: number; top: number }): Rect {
  const width = screen.width * shape.width
  const height = screen.height * shape.height

  return {
    left: screen.left + (screen.width - width) / 2,
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
  const heroRef = useRef<HTMLButtonElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const screenEffectRef = useRef<HTMLDivElement>(null)
  const stringRef = useRef<HTMLSpanElement>(null)
  const pinRef = useRef<HTMLSpanElement>(null)
  const [imageFailed, setImageFailed] = useState(false)

  const scrollToExperiences = useCallback(() => {
    sectionContext?.scrollToId("experiences", {
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }, [sectionContext])

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

  useGSAP(
    () => {
      const hero = heroRef.current
      const frame = frameRef.current
      const photo = photoRef.current
      const screenEffect = screenEffectRef.current
      const string = stringRef.current
      const pin = pinRef.current
      const home = document.getElementById("home")
      const about = document.getElementById("about")
      const macFrame = document.querySelector<HTMLElement>("[data-mac-frame]")
      const macScene = document.querySelector<HTMLElement>("[data-mac-scene]")
      const macShell = document.querySelector<HTMLElement>("[data-mac-shell]")
      const macScreen = document.querySelector<HTMLElement>("[data-mac-screen]")
      const macScreenEffect = document.querySelector<HTMLElement>("[data-mac-screen] .mac-screen-effect")
      const aboutMarker = document.querySelector<HTMLElement>("[data-hero-polaroid-marker='about']")

      if (!hero || !frame || !photo || !screenEffect || !string || !pin || !home || !about || !macFrame || !macScene || !macShell || !macScreen || !macScreenEffect || !aboutMarker) {
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
        gsap.killTweensOf([hero, frame, photo, screenEffect, string, pin, macFrame, macScene, macShell, macScreenEffect])
        gsap.set(macFrame, { scale: 1, transformOrigin: `${SCREEN.originX * 100}% ${SCREEN.originY * 100}%` })

        const startScroll = home.offsetTop
        const endScroll = startScroll + home.offsetHeight - window.innerHeight
        const screenBase = elementRect(macScreen)
        const screenStart = screenRectAt(screenBase, 0)
        const screenPolaroid = polaroidInScreen(screenRectAt(screenBase, 0.22), {
          width: 0.34,
          height: 0.5,
          top: 0.24,
        })
        const screenSmall = polaroidInScreen(screenRectAt(screenBase, 0.58), {
          width: 0.13,
          height: 0.23,
          top: 0.31,
        })
        const aboutPolaroid = markerRectAtScroll(aboutMarker, endScroll)
        const aboutExitPolaroid = markerRectAtScroll(aboutMarker, endScroll + about.offsetHeight)

        gsap.set(macScene, { opacity: 1 })
        gsap.set([macShell, macScreenEffect, screenEffect], { opacity: 1 })
        gsap.set(hero, {
          ...rectVars(screenStart),
          opacity: 1,
          rotate: 0,
          transformOrigin: "50% 0%",
        })
        gsap.set(frame, { opacity: 0 })
        gsap.set([string, pin], { opacity: 0 })
        gsap.set(photo, { top: 0, right: 0, bottom: 0, left: 0 })

        timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: home,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        })

        timeline
          .to(macFrame, { scale: 9.2, duration: 0.72 }, 0)
          .to(macShell, { opacity: 0, duration: 0.18 }, 0.58)
          .to([macScreenEffect, screenEffect], { opacity: 0, duration: 0.18 }, 0.6)
          .to(macScene, { opacity: 0, duration: 0.08 }, 0.84)
          .to(hero, { ...rectVars(screenPolaroid), rotate: -2.2, duration: 0.18, ease: "power1.inOut" }, 0.08)
          .to(frame, { opacity: 1, duration: 0.12 }, 0.09)
          .to([string, pin], { opacity: 1, duration: 0.12 }, 0.12)
          .to(photo, { top: "5%", right: "5%", bottom: "18%", left: "5%", duration: 0.12 }, 0.09)
          .to(hero, { ...rectVars(screenSmall), rotate: -3, duration: 0.3 }, 0.28)
          .to([string, pin], { opacity: 0, duration: 0.14 }, 0.62)
          .to(hero, { ...rectVars(aboutPolaroid), rotate: -3, duration: 0.28, ease: "power1.inOut" }, 0.58)

        followTimeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: about,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        })

        followTimeline.fromTo(
          hero,
          { ...rectVars(aboutPolaroid), opacity: 1, rotate: -3 },
          { ...rectVars(aboutExitPolaroid), rotate: -3, duration: 1, immediateRender: false },
        )
        followTimeline.to(hero, { opacity: 0, duration: 0.16 }, 0.84)
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
      <button
        ref={heroRef}
        type="button"
        aria-label="Jump to the experiences section"
        onClick={scrollToExperiences}
        className="pointer-events-auto fixed left-0 top-0 block cursor-crosshair overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <span
          ref={stringRef}
          aria-hidden="true"
          className="absolute left-1/2 top-[-14%] h-[16%] w-px -translate-x-1/2 bg-accent/70"
        />
        <span
          ref={pinRef}
          aria-hidden="true"
          className="absolute left-1/2 top-[-16%] size-[2.8%] -translate-x-1/2 rounded-full bg-accent"
        />
        <div ref={frameRef} aria-hidden="true" className="absolute inset-0 bg-[#efede2] shadow-polaroid" />
        <div ref={photoRef} className="absolute inset-0 overflow-hidden bg-muted">
          {imageFailed ? (
            <div className="absolute inset-0 bg-muted" />
          ) : (
            <img
              src={HERO_IMAGE}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.08]"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
        <div
          ref={screenEffectRef}
          aria-hidden="true"
          className="mac-screen-effect pointer-events-none absolute inset-0 z-40"
        >
          <span className="mac-screen-glare" />
          <span className="mac-screen-noise" />
        </div>
      </button>
    </div>
  )
}
