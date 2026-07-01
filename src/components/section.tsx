import { useEffect, useRef } from "react"
import type { ReactNode } from "react"

import { useSectionContext } from "@/hooks/section-context"
import { cn } from "@/lib/utils"

type SectionProps = {
  id: string
  label?: string
  className?: string
  innerClassName?: string
  children: ReactNode
  as?: "section" | "article" | "main"
}

export function Section({
  id,
  label,
  className,
  innerClassName,
  children,
  as: As = "section",
}: SectionProps) {
  const ctx = useSectionContext()
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!ctx) return
    ctx.register(id, ref.current)
    return () => ctx.register(id, null)
  }, [ctx, id])

  return (
    <As
      ref={(node) => {
        ref.current = node as HTMLElement | null
      }}
      id={id}
      data-section-id={id}
      aria-label={label}
      className={cn(
        "relative flex min-h-svh w-full flex-col",
        className,
      )}
    >
      <div className={cn("relative flex w-full flex-1 flex-col", innerClassName)}>{children}</div>
    </As>
  )
}
