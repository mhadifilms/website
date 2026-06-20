import { useEffect, useState } from "react"
import { m } from "framer-motion"

import { PolaroidPlaceholder, type PolaroidPlaceholderKind } from "@/components/polaroid-placeholder"
import { cn } from "@/lib/utils"

export type PolaroidProps = {
  src?: string
  alt?: string
  caption?: string
  tilt?: number
  className?: string
  index?: number
  placeholderKind?: PolaroidPlaceholderKind
}

export function Polaroid({
  src,
  alt = "",
  tilt = -4,
  className,
  index = 0,
  placeholderKind = "generic",
}: PolaroidProps) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    if (!src) return
    let cancelled = false
    const probe = new Image()
    probe.src = src
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
  }, [src])

  const usePlaceholder = !src || imageFailed

  return (
    <m.figure
      initial={{ opacity: 0, y: -32, rotate: tilt + (tilt > 0 ? 6 : -6) }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -6, scale: 1.04 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        type: "spring",
        stiffness: 180,
        damping: 14,
        delay: 0.08 * index,
      }}
      className={cn(
        "group relative flex w-full flex-col rounded-[6px] bg-card p-2 pb-7 shadow-polaroid ring-1 ring-border/40 sm:p-3 sm:pb-10",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-[3deg] rounded-sm bg-foreground/15 backdrop-blur-sm"
      />
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[3px] bg-muted">
        {!usePlaceholder && src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="block size-full object-cover grayscale-[0.1]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PolaroidPlaceholder kind={placeholderKind} />
        )}
      </div>
    </m.figure>
  )
}
