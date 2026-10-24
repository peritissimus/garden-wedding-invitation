/**
 * Global pacing. 1 = the brisk defaults; raise a value to slow that part down.
 * Press/hover feedback is deliberately not scaled — it must stay instant.
 */
export const TEMPO = {
  /** The rose blooming and the hero entrance — the once-per-visit ceremony. */
  opening: 1.35,
  /**
   * Scroll reveals, line drawings and flourishes further down the page. Kept at
   * 1: text reveals are interface, and interface motion stays under 300ms.
   */
  reveal: 1,
}

/**
 * Blur-in reveals only where they're cheap. On a phone every blurred word is
 * its own offscreen pass, so there text simply rises and fades.
 */
const SOFT = matchMedia('(hover: hover) and (pointer: fine)').matches
export const blur = (px: number) => (SOFT ? { filter: `blur(${px}px)` } : {})

/** Play an animation at the reveal tempo (scales its duration and staggers). */
export const slow = <T extends gsap.core.Animation>(a: T): T => a.timeScale(1 / TEMPO.reveal) as T
