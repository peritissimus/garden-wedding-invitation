/**
 * Global pacing. 1 = the brisk defaults; raise a value to slow that part down.
 * Press/hover feedback is deliberately not scaled — it must stay instant.
 */
export const TEMPO = {
  /** Envelope opening and hero entrance — the once-per-visit ceremony. */
  opening: 1.6,
  /** Scroll reveals, line drawings and flourishes further down the page. */
  reveal: 1.35,
}

/** Play an animation at the reveal tempo (scales its duration and staggers). */
export const slow = <T extends gsap.core.Animation>(a: T): T => a.timeScale(1 / TEMPO.reveal) as T
