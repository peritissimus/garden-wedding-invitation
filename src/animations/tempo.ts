/**
 * Global pacing. 1 = the brisk defaults; raise a value to slow that part down.
 * Press/hover feedback is deliberately not scaled — it must stay instant.
 */
export const TEMPO = {
  /** Envelope opening and hero entrance — the once-per-visit ceremony. */
  opening: 1.6,
  /**
   * Scroll reveals, line drawings and flourishes further down the page. Kept at
   * 1: text reveals are interface, and interface motion stays under 300ms.
   */
  reveal: 1,
}

/** Touch screens: a flick outruns any fade, so text and numbers are simply shown. */
export const TOUCH = matchMedia('(pointer: coarse)').matches

/** Play an animation at the reveal tempo (scales its duration and staggers). */
export const slow = <T extends gsap.core.Animation>(a: T): T => a.timeScale(1 / TEMPO.reveal) as T
