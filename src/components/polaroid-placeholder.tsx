import { cn } from "@/lib/utils"

export type PolaroidPlaceholderKind = "on-set" | "lens" | "sync" | "podcast" | "generic"

type PolaroidPlaceholderProps = {
  kind?: PolaroidPlaceholderKind
  className?: string
}

const PALETTE: Record<
  PolaroidPlaceholderKind,
  { bg: string; bgEnd: string; ink: string; accent: string }
> = {
  "on-set": { bg: "#2c2a26", bgEnd: "#0f0e0b", ink: "#f4ecd6", accent: "#d8a23b" },
  lens: { bg: "#d6cdb6", bgEnd: "#8a8270", ink: "#181814", accent: "#6b3f1e" },
  sync: { bg: "#1f2a3b", bgEnd: "#0a1220", ink: "#dfe6f2", accent: "#4a8de8" },
  podcast: { bg: "#1d2934", bgEnd: "#0c141d", ink: "#f0e6d2", accent: "#d4a851" },
  generic: { bg: "#cfc6b0", bgEnd: "#7a715c", ink: "#1d1d18", accent: "#7a3030" },
}

export function PolaroidPlaceholder({ kind = "generic", className }: PolaroidPlaceholderProps) {
  const palette = PALETTE[kind] ?? PALETTE.generic

  return (
    <svg
      viewBox="0 0 100 130"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ backgroundColor: palette.bg }}
      className={cn("block size-full", className)}
    >
      <rect x="0" y="0" width="100" height="130" fill={palette.bg} />
      <rect x="0" y="65" width="100" height="65" fill={palette.bgEnd} opacity="0.55" />

      {kind === "on-set" && <OnSetArt ink={palette.ink} accent={palette.accent} bg={palette.bg} />}
      {kind === "lens" && <LensArt ink={palette.ink} accent={palette.accent} bg={palette.bg} />}
      {kind === "sync" && <SyncArt ink={palette.ink} accent={palette.accent} bg={palette.bg} />}
      {kind === "podcast" && <PodcastArt ink={palette.ink} accent={palette.accent} bg={palette.bg} />}
      {kind === "generic" && <GenericArt ink={palette.ink} accent={palette.accent} bg={palette.bg} />}
    </svg>
  )
}

type ArtProps = { ink: string; accent: string; bg: string }

function OnSetArt({ ink, accent }: ArtProps) {
  return (
    <g>
      <circle cx="78" cy="22" r="9" fill={accent} opacity="0.85" />
      <circle cx="78" cy="22" r="4" fill={ink} opacity="0.55" />
      <line x1="78" y1="31" x2="64" y2="62" stroke={ink} strokeOpacity="0.5" strokeWidth="0.8" />

      <rect x="22" y="64" width="58" height="38" rx="3" fill={ink} opacity="0.95" />
      <rect x="18" y="68" width="10" height="14" rx="1.5" fill={ink} opacity="0.95" />
      <circle cx="50" cy="83" r="9" fill="#000" opacity="0.85" />
      <circle cx="50" cy="83" r="5.5" fill={accent} opacity="0.85" />
      <circle cx="50" cy="83" r="2.4" fill="#000" />
      <rect x="74" y="68" width="14" height="4" rx="0.8" fill={ink} opacity="0.85" />
      <circle cx="72" cy="76" r="1.2" fill="#ff5252" />

      <rect x="44" y="102" width="12" height="6" rx="0.5" fill={ink} opacity="0.85" />
      <rect x="38" y="108" width="24" height="3" rx="0.4" fill={ink} opacity="0.75" />

      <path d="M 0 118 L 24 112 L 58 118 L 100 110 L 100 130 L 0 130 Z" fill={ink} opacity="0.35" />
    </g>
  )
}

function LensArt({ ink, accent }: ArtProps) {
  return (
    <g>
      <circle cx="50" cy="62" r="34" fill={ink} opacity="0.95" />
      <circle cx="50" cy="62" r="28" fill={accent} opacity="0.92" />
      <circle cx="50" cy="62" r="22" fill={ink} opacity="0.95" />
      <circle cx="50" cy="62" r="15" fill={accent} opacity="0.85" />
      <circle cx="50" cy="62" r="9" fill={ink} opacity="0.98" />
      <circle cx="44" cy="56" r="3.6" fill="#fff" opacity="0.75" />
      <circle cx="58" cy="68" r="1.6" fill="#fff" opacity="0.45" />

      <rect x="20" y="106" width="60" height="3" rx="0.6" fill={ink} opacity="0.45" />
      <rect x="28" y="112" width="44" height="2" rx="0.4" fill={ink} opacity="0.35" />
    </g>
  )
}

function SyncArt({ ink, accent }: ArtProps) {
  return (
    <g>
      <circle cx="50" cy="56" r="26" fill="none" stroke={ink} strokeOpacity="0.18" strokeWidth="1" />
      <path
        d="M 50 30 A 26 26 0 0 1 76 56 L 68 56 A 18 18 0 0 0 50 38 Z"
        fill={accent}
      />
      <polygon points="50,28 56,38 44,38" fill={accent} />
      <path
        d="M 50 82 A 26 26 0 0 1 24 56 L 32 56 A 18 18 0 0 0 50 74 Z"
        fill={ink}
        opacity="0.85"
      />
      <polygon points="50,84 44,74 56,74" fill={ink} opacity="0.85" />

      <text
        x="50"
        y="108"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="7"
        fontWeight="600"
        letterSpacing="0.18em"
        fill={ink}
      >
        SYNC. LABS
      </text>
      <line x1="34" y1="116" x2="66" y2="116" stroke={ink} strokeOpacity="0.4" strokeWidth="0.5" />
    </g>
  )
}

function PodcastArt({ ink, accent }: ArtProps) {
  return (
    <g>
      {/* mic body */}
      <rect x="42" y="34" width="16" height="36" rx="8" fill={ink} opacity="0.95" />
      <rect x="42" y="34" width="16" height="36" rx="8" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.6" />
      {[40, 46, 52, 58, 64].map((y) => (
        <line key={y} x1="44" y1={y} x2="56" y2={y} stroke={accent} strokeOpacity="0.5" strokeWidth="0.5" />
      ))}
      {/* mic arm */}
      <path d="M 32 56 A 18 18 0 0 0 68 56" fill="none" stroke={ink} strokeOpacity="0.7" strokeWidth="1.4" />
      <line x1="50" y1="70" x2="50" y2="84" stroke={ink} strokeOpacity="0.7" strokeWidth="1.4" />
      <rect x="36" y="84" width="28" height="3.5" rx="1.5" fill={ink} opacity="0.8" />
      {/* waveform */}
      <g opacity="0.8">
        {[
          [20, 100, 3, 8],
          [26, 102, 3, 6],
          [32, 99, 3, 9],
          [38, 101, 3, 7],
          [44, 100, 3, 8],
          [50, 98, 3, 10],
          [56, 100, 3, 8],
          [62, 102, 3, 6],
          [68, 99, 3, 9],
          [74, 101, 3, 7],
          [80, 100, 3, 8],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="1" fill={accent} />
        ))}
      </g>
      <text
        x="50"
        y="120"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="5.5"
        fontWeight="600"
        letterSpacing="0.18em"
        fill={ink}
        opacity="0.9"
      >
        JOURNEY TELLERS
      </text>
    </g>
  )
}

function GenericArt({ ink, accent }: ArtProps) {
  return (
    <g>
      <rect x="14" y="22" width="72" height="80" rx="2" fill={ink} opacity="0.08" />
      <circle cx="32" cy="40" r="5" fill={accent} opacity="0.85" />
      <path d="M 14 92 L 36 70 L 56 84 L 76 60 L 86 102 L 14 102 Z" fill={ink} opacity="0.75" />
    </g>
  )
}
