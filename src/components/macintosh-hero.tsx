import type { ReactNode } from "react"

import { MAC_SCREEN_RECT } from "@/components/macintosh-constants"
import { cn } from "@/lib/utils"

type MacintoshHeroProps = {
  /** Optional overlay rendered inside the screen window (above whatever sits behind the Mac). */
  children?: ReactNode
  className?: string
  ariaLabel?: string
  /** When true, the screen area is transparent (so a layer behind the Mac can show through). */
  transparentScreen?: boolean
}

export function MacintoshHero({
  children,
  className,
  ariaLabel = "Vintage Macintosh",
  transparentScreen = true,
}: MacintoshHeroProps) {
  return (
    <div
      className={cn("relative w-full select-none", className)}
      style={{ aspectRatio: "533 / 620" }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 533 620"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mac-case" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mac-case)" />
            <stop offset="45%" stopColor="var(--color-mac-case)" />
            <stop offset="100%" stopColor="var(--color-mac-case-shadow)" />
          </linearGradient>
          <linearGradient id="mac-case-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mac-bezel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mac-bezel)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--color-mac-case-shadow)" stopOpacity="1" />
          </linearGradient>
          <radialGradient id="mac-screen" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="var(--color-mac-screen)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-mac-screen)" stopOpacity="0.82" />
          </radialGradient>
          <linearGradient id="mac-foot-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="black" stopOpacity="0.12" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </linearGradient>

          <mask id="mac-case-mask">
            <rect x="0" y="0" width="533" height="620" fill="white" />
            <rect
              x="86"
              y="56"
              width="361"
              height="268"
              rx="16"
              ry="16"
              fill={transparentScreen ? "black" : "white"}
            />
          </mask>
        </defs>

        <ellipse cx="266.5" cy="592" rx="170" ry="10" fill="url(#mac-foot-shadow)" />

        <g mask="url(#mac-case-mask)">
          <path
            d="M 50 8
               Q 30 8 30 28
               L 30 470
               Q 30 484 44 490
               L 56 496
               L 56 540
               Q 56 562 78 562
               L 138 562
               L 138 556
               L 84 556
               Q 70 556 70 542
               L 70 500
               Q 70 494 76 494
               L 457 494
               Q 463 494 463 500
               L 463 542
               Q 463 556 449 556
               L 395 556
               L 395 562
               L 455 562
               Q 477 562 477 540
               L 477 496
               L 489 490
               Q 503 484 503 470
               L 503 28
               Q 503 8 483 8
               Z"
            fill="url(#mac-case)"
          />

          <path
            d="M 50 8 Q 30 8 30 28 L 30 220 Q 60 60 200 30 Q 360 0 503 80 L 503 28 Q 503 8 483 8 Z"
            fill="url(#mac-case-shine)"
          />

          <rect
            x="50"
            y="26"
            width="433"
            height="368"
            rx="20"
            ry="20"
            fill="url(#mac-bezel)"
          />
          <rect
            x="50"
            y="26"
            width="433"
            height="368"
            rx="20"
            ry="20"
            fill="none"
            stroke="var(--color-mac-case-shadow)"
            strokeOpacity="0.55"
            strokeWidth="1"
          />

          <rect
            x="78"
            y="48"
            width="377"
            height="284"
            rx="20"
            ry="20"
            fill="#0e0e0e"
          />

          {!transparentScreen && (
            <rect
              x="86"
              y="56"
              width="361"
              height="268"
              rx="16"
              ry="16"
              fill="url(#mac-screen)"
            />
          )}
        </g>

        <g mask="url(#mac-case-mask)" opacity="0.9">
          <text
            x="266.5"
            y="378"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fontSize="14"
            letterSpacing="0.04em"
            fill="var(--color-foreground)"
            opacity="0.5"
          >
            mhadi.tv
          </text>
        </g>

        <g mask="url(#mac-case-mask)">
          <rect x="74" y="416" width="244" height="58" rx="6" fill="var(--color-mac-case-shadow)" opacity="0.55" />
          <rect x="86" y="430" width="220" height="28" rx="3" fill="var(--color-mac-case)" opacity="0.55" />
          <rect x="92" y="438" width="195" height="11" rx="1.5" fill="var(--color-mac-case-shadow)" opacity="0.7" />
          <circle cx="298" cy="444" r="4" fill="var(--color-mac-case-shadow)" opacity="0.85" />

          <rect x="338" y="416" width="120" height="58" rx="6" fill="var(--color-mac-case-shadow)" opacity="0.5" />
          <circle cx="398" cy="445" r="14" fill="var(--color-mac-bezel)" opacity="0.55" />
          <circle cx="398" cy="445" r="10" fill="var(--color-mac-case-shadow)" opacity="0.7" />
          <circle cx="398" cy="445" r="3.5" fill="var(--color-mac-case)" opacity="0.9" />
          <rect x="440" y="428" width="2" height="14" rx="1" fill="var(--color-mac-case-shadow)" opacity="0.7" />
          <rect x="446" y="428" width="2" height="14" rx="1" fill="var(--color-mac-case-shadow)" opacity="0.7" />

          <rect x="208" y="510" width="118" height="44" rx="8" fill="var(--color-mac-bezel)" opacity="0.45" />
          <rect x="220" y="522" width="94" height="20" rx="2" fill="var(--color-mac-case-shadow)" opacity="0.55" />
          <rect x="225" y="528" width="84" height="8" rx="1" fill="var(--color-mac-case)" opacity="0.4" />
        </g>
      </svg>

      {children && (
        <div
          className="pointer-events-none absolute overflow-hidden"
          style={{
            left: `${MAC_SCREEN_RECT.x * 100}%`,
            top: `${MAC_SCREEN_RECT.y * 100}%`,
            width: `${MAC_SCREEN_RECT.width * 100}%`,
            height: `${MAC_SCREEN_RECT.height * 100}%`,
            borderRadius: "calc(16 / 533 * 100%)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
