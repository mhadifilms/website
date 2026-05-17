import { cn } from "@/lib/utils"

type PortraitPlaceholderProps = {
  className?: string
}

/**
 * A high-contrast monochrome silhouette of a person framed by a video camera.
 * Renders inside the Macintosh screen (and bleeds horizontally past it) when no
 * real portrait asset is provided. Background is transparent so the page color
 * shows through; only the silhouette and camera are painted, with a soft horizon
 * line to anchor the figure.
 */
export function PortraitPlaceholder({ className }: PortraitPlaceholderProps) {
  return (
    <svg
      viewBox="0 0 800 400"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("block size-full", className)}
    >
      <defs>
        <linearGradient id="portrait-horizon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity="0" />
          <stop offset="22%" stopColor="var(--color-foreground)" stopOpacity="0.12" />
          <stop offset="78%" stopColor="var(--color-foreground)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="portrait-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity="0.92" />
          <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      <rect x="0" y="232" width="800" height="2" fill="url(#portrait-horizon)" />
      <rect x="0" y="260" width="800" height="1" fill="url(#portrait-horizon)" opacity="0.6" />

      <g fill="url(#portrait-body)">
        <path d="M 0 400 L 0 308 Q 80 296 160 304 Q 260 314 320 296 Q 350 282 370 254 L 430 254 Q 450 282 480 296 Q 540 314 640 304 Q 720 296 800 308 L 800 400 Z" />
      </g>

      <g fill="var(--color-foreground)" opacity="0.96">
        <ellipse cx="400" cy="206" rx="38" ry="44" />
        <path d="M 360 248 Q 390 244 400 246 Q 410 244 440 248 L 440 270 Q 420 274 400 274 Q 380 274 360 270 Z" />
      </g>

      <g transform="translate(486, 188)" fill="var(--color-foreground)">
        <rect x="0" y="-26" width="148" height="74" rx="6" opacity="0.94" />
        <rect x="-20" y="-14" width="24" height="50" rx="3" opacity="0.94" />
        <circle cx="74" cy="10" r="26" opacity="0.96" />
        <circle cx="74" cy="10" r="18" fill="var(--color-mac-screen)" opacity="0.65" />
        <circle cx="74" cy="10" r="11" fill="var(--color-foreground)" opacity="0.96" />
        <circle cx="74" cy="10" r="4" fill="var(--color-mac-screen)" opacity="0.85" />
        <rect x="120" y="-38" width="56" height="18" rx="3" opacity="0.92" />
        <rect x="130" y="-52" width="6" height="16" rx="1" opacity="0.92" />
        <rect x="146" y="-52" width="6" height="16" rx="1" opacity="0.92" />
        <circle cx="142" cy="-29" r="3" fill="#ff5252" opacity="0.85" />
      </g>

      <g fill="var(--color-foreground)" opacity="0.78">
        <rect x="120" y="320" width="60" height="2" />
        <rect x="120" y="330" width="40" height="2" />
        <rect x="630" y="324" width="46" height="2" />
        <rect x="630" y="334" width="34" height="2" />
      </g>
    </svg>
  )
}
