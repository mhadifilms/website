import { useEffect, useRef, useState } from "react"

type PixelImageProps = {
  src?: string
  alt?: string
  /** Horizontal resolution of the pixel grid. Smaller = chunkier 8-bit look. */
  resolution?: number
  /** Aspect ratio (width / height) of the pixel grid. */
  aspect?: number
  className?: string
}

/**
 * Renders an image as a chunky 8-bit pixel render by drawing it into a tiny
 * offscreen grid, then upscaling with nearest-neighbour. Works with remote
 * images (YouTube/Substack thumbnails) because we only ever *display* the
 * canvas — we never read pixels back, so cross-origin tainting is irrelevant.
 */
export function PixelImage({ src, alt = "", resolution = 30, aspect = 4 / 3, className }: PixelImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !src) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = Math.max(8, Math.round(resolution))
    const h = Math.max(6, Math.round(resolution / aspect))
    canvas.width = w
    canvas.height = h
    setReady(false)

    let cancelled = false
    const img = new Image()
    img.decoding = "async"
    img.onload = () => {
      if (cancelled) return
      const scale = Math.max(w / img.width, h / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, w, h)
      try {
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
        setReady(true)
      } catch {
        setReady(false)
      }
    }
    img.onerror = () => setReady(false)
    img.src = src

    return () => {
      cancelled = true
    }
  }, [src, resolution, aspect])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{
        imageRendering: "pixelated",
        opacity: ready ? 1 : 0,
        transition: "opacity 220ms ease",
      }}
    />
  )
}

export default PixelImage
