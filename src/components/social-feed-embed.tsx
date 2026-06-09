import { useEffect, useMemo } from "react"
import { m } from "framer-motion"

import type { ArchiveItem, ArchivePlatform, SocialLink } from "@/content/types"

type SocialFeedEmbedProps = {
  platform: ArchivePlatform
  social?: SocialLink
  items: ArchiveItem[]
}

function linkedInActivityId(href: string) {
  return href.match(/activity-(\d+)/)?.[1]
}

export function SocialFeedEmbed({ platform, social, items }: SocialFeedEmbedProps) {
  const linkedInEmbeds = useMemo(
    () =>
      items
        .map((item) => ({ item, activityId: linkedInActivityId(item.href) }))
        .filter((entry): entry is { item: ArchiveItem; activityId: string } => Boolean(entry.activityId)),
    [items],
  )

  useEffect(() => {
    if (platform !== "Instagram" || !social?.embedScriptSrc || !social.embedAppId) return

    const existing = document.querySelector<HTMLScriptElement>(`script[src='${social.embedScriptSrc}']`)
    if (existing) {
      existing.remove()
    }

    const script = document.createElement("script")
    script.src = social.embedScriptSrc
    script.async = true
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [platform, social?.embedAppId, social?.embedScriptSrc])

  if (platform === "Twitter" && social?.embedSrc) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-6 w-full max-w-[min(100%,860px)] overflow-hidden rounded-[28px] bg-white/70 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.08)]"
      >
        <iframe
          src={social.embedSrc}
          title={social.embedTitle ?? "Latest posts from X"}
          loading="lazy"
          className="block h-[min(72svh,760px)] w-full rounded-[20px] bg-white"
        />
      </m.div>
    )
  }

  if (platform === "Instagram" && social?.embedAppId) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-6 w-full max-w-[min(100%,860px)] overflow-hidden rounded-[28px] bg-white/70 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.08)]"
      >
        <div
          className={`elfsight-app-${social.embedAppId}`}
          data-elfsight-app-lazy=""
          aria-label={social.embedTitle ?? "Latest Instagram posts"}
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
