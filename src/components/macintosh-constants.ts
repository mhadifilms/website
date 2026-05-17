/**
 * Geometry of the Macintosh screen window inside the MacintoshHero SVG viewport.
 * Coordinates are normalized fractions (0..1) of the 533x620 viewBox.
 */
export const MAC_SCREEN_RECT = {
  x: 86 / 533,
  y: 56 / 620,
  width: 361 / 533,
  height: 268 / 620,
} as const

export const MAC_ASPECT_RATIO = 533 / 620
