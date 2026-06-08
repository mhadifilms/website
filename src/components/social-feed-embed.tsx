import { useEffect, useMemo, useRef, useState } from "react"
import { m } from "framer-motion"

import type { ArchiveItem, ArchivePlatform, SocialLink } from "@/content/types"

type SocialFeedEmbedProps = {
  platform: ArchivePlatform
  social?: SocialLink
  items: ArchiveItem[]
}

type TwitterWindow = Window & {
  twttr?: {
    widgets?: {
      load: (element?: HTMLElement | null) => Promise<unknown> | void
    }
  }
}

function linkedInActivityId(href: string) {
  return href.match(/activity-(\d+)/)?.[1]
}

export function SocialFeedEmbed({ platform, social, items }: SocialFeedEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const profileHref = social?.href ?? "#"
  const [twitterReady, setTwitterReady] = useState(false)
  const linkedInEmbeds = useMemo(
    () =>
      items
        .map((item) => ({ item, activityId: linkedInActivityId(item.href) }))
        .filter((entry): entry is { item: ArchiveItem; activityId: string } => Boolean(entry.activityId)),
    [items],
  )

  useEffect(() => {
    if (platform !== "Twitter") return

    setTwitterReady(false)
    const win = window as TwitterWindow
    const container = containerRef.current
    const markReady = () => setTwitterReady(Boolean(container?.querySelector("iframe")))
    const observer = new MutationObserver(markReady)
    if (container) observer.observe(container, { childList: true, subtree: true })
    const loadTwitterWidgets = () => {
      const result = win.twttr?.widgets?.load(container)
      if (result && "then" in result) result.then(markReady)
      markReady()
    }

    if (win.twttr?.widgets) {
      loadTwitterWidgets()
      return () => observer.disconnect()
    }

    const existing = document.querySelector<HTMLScriptElement>("script[src='https://platform.twitter.com/widgets.js']")
    if (existing) {
      existing.addEventListener("load", loadTwitterWidgets, { once: true })
      return () => observer.disconnect()
    }

    const script = document.createElement("script")
    script.src = "https://platform.twitter.com/widgets.js"
    script.async = true
    script.charset = "utf-8"
    script.onload = loadTwitterWidgets
    document.body.appendChild(script)

    return () => observer.disconnect()
  }, [platform, profileHref])

  if (platform === "Twitter") {
    return (
      <m.div
        ref={containerRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto mb-6 w-full max-w-[min(100%,680px)] overflow-hidden rounded-[28px] bg-white/70 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.08)] [&_iframe[id^='twitter-widget']]:h-[min(62svh,560px)]! [&_iframe[id^='twitter-widget']]:max-w-full! [&_iframe[id^='twitter-widget']]:w-full!"
      >
        {!twitterReady && (
          <div className="pointer-events-none absolute inset-3 grid min-h-[220px] place-items-center rounded-[22px] bg-white/70 px-6 text-center text-sm font-light text-black/55">
            Loading latest posts from X...
          </div>
        )}
        <a
          className="twitter-timeline"
          data-height="560"
          data-width="680"
          data-dnt="true"
          data-chrome="noheader nofooter noborders transparent"
          href={profileHref}
        >
          Latest posts from {profileHref}
        </a>
      </m.div>
    )
  }

  if (platform === "Instagram" && social?.embedSrc) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-6 w-full max-w-[min(100%,860px)] overflow-hidden rounded-[28px] bg-white/70 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.08)]"
      >
        <iframe
          src={social.embedSrc}
          title={social.embedTitle ?? "Latest Instagram posts"}
          loading="lazy"
          className="block h-[min(72svh,760px)] w-full rounded-[20px] bg-white"
        />
      </m.div>
    )
  }

  if (platform === "Linkedin" && linkedInEmbeds.length > 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-6 grid w-full max-w-[min(100%,1040px)] gap-5 md:grid-cols-2"
      >
        {linkedInEmbeds.slice(0, 2).map(({ item, activityId }) => (
          <iframe
            key={activityId}
            src={`https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`}
            title={item.title}
            loading="lazy"
            className="h-[min(64svh,560px)] w-full rounded-[24px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)]"
            allowFullScreen
          />
        ))}
      </m.div>
    )
  }

  return null
}
