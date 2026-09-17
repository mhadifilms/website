// Keep the initial zoom brisk, then gradually settle into the About section.
// Shared by GSAP and Motion so the photos and text arrive together.
export function easeHomeScroll(progress: number) {
  return (4 * progress - progress ** 4) / 3
}
