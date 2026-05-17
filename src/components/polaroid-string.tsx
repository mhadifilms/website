import { Polaroid } from "@/components/polaroid"
import type { PolaroidProps } from "@/components/polaroid"
import type { PolaroidPlaceholderKind } from "@/components/polaroid-placeholder"
import { cn } from "@/lib/utils"

export type StringPolaroid = Pick<PolaroidProps, "src" | "alt" | "caption"> & {
  placeholderKind?: PolaroidPlaceholderKind
}

type PolaroidStringProps = {
  left: StringPolaroid[]
  right: StringPolaroid[]
  children: React.ReactNode
  className?: string
}

const LEFT_TILTS = [-6, -2]
const RIGHT_TILTS = [3, 7]
const LEFT_OFFSETS_PX = [0, 36]
const RIGHT_OFFSETS_PX = [36, 0]

export function PolaroidString({ left, right, children, className }: PolaroidStringProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox="0 0 1600 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-16 w-full lg:block"
      >
        <path
          d="M 0 40 C 200 8 380 78 560 50 C 720 26 880 86 1040 52 C 1200 22 1380 78 1600 40"
          fill="none"
          stroke="var(--color-foreground)"
          strokeOpacity="0.35"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative grid grid-cols-1 items-start gap-10 lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:gap-12 xl:grid-cols-[200px_minmax(0,1fr)_200px] xl:gap-16">
        <div className="hidden gap-5 lg:flex lg:flex-col xl:gap-7">
          {left.map((item, index) => (
            <div
              key={`left-${index}`}
              className="w-[150px] xl:w-[175px]"
              style={{ marginTop: `${LEFT_OFFSETS_PX[index] ?? 0}px` }}
            >
              <Polaroid
                src={item.src}
                alt={item.alt}
                caption={item.caption}
                placeholderKind={item.placeholderKind}
                tilt={LEFT_TILTS[index] ?? -3}
                index={index}
              />
            </div>
          ))}
        </div>

        <div className="relative pt-2 lg:pt-6">{children}</div>

        <div className="hidden gap-5 lg:flex lg:flex-col xl:gap-7">
          {right.map((item, index) => (
            <div
              key={`right-${index}`}
              className="w-[150px] xl:w-[175px]"
              style={{ marginTop: `${RIGHT_OFFSETS_PX[index] ?? 0}px` }}
            >
              <Polaroid
                src={item.src}
                alt={item.alt}
                caption={item.caption}
                placeholderKind={item.placeholderKind}
                tilt={RIGHT_TILTS[index] ?? 3}
                index={index + 2}
              />
            </div>
          ))}
        </div>

        <div className="mx-auto grid w-full max-w-[480px] grid-cols-4 gap-2 px-2 sm:max-w-[640px] sm:gap-3 lg:hidden">
          {[...left, ...right].map((item, index) => (
            <Polaroid
              key={`mobile-${index}`}
              src={item.src}
              alt={item.alt}
              caption={item.caption}
              placeholderKind={item.placeholderKind}
              tilt={index % 2 === 0 ? -3 : 3}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
