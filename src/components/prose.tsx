import { cn } from "@/lib/utils"

export function Prose({ className, html }: { className?: string; html: string }) {
  return (
    <article
      className={cn(
        "prose-content max-w-none text-lg leading-8 text-foreground/85",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
