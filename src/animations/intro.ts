import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

interface IntroOptions {
  lenis: Lenis | null
  reduced: boolean
  hero: () => gsap.core.Timeline
}

/** The seal cracks along its seam and the halves fall away. */
function crack(seal: HTMLElement) {
  const whole = seal.querySelector('.seal-whole')
  const left = seal.querySelector('.seal-l')
  const right = seal.querySelector('.seal-r')
  return gsap
    .timeline({ defaults: { ease: 'emilOut' } })
    .to(seal, { scale: 0.94, duration: 0.1 })
    .set(whole, { autoAlpha: 0 })
    .set([left, right], { autoAlpha: 1 })
    .to(seal, { scale: 1, duration: 0.3 })
    .to(left, { x: -4, rotation: -9, svgOrigin: '50 92', duration: 0.16 }, '<')
    .to(right, { x: 4, rotation: 9, svgOrigin: '50 92', duration: 0.16 }, '<')
    .to(left, { x: -24, y: 74, rotation: -36, autoAlpha: 0, duration: 0.55, ease: 'power2.in' }, '>-0.04')
    .to(right, { x: 22, y: 82, rotation: 32, autoAlpha: 0, duration: 0.55, ease: 'power2.in' }, '<')
}

/**
 * The page stays locked behind the envelope until the guest either taps the
 * seal or tries to scroll (wheel, swipe up, arrow/space). Either one plays
 * the same ~1.5s opening, then hands scrolling back.
 */
export function setupIntro({ lenis, reduced, hero }: IntroOptions) {
  const root = document.documentElement
  const intro = document.getElementById('intro')!
  const seal = document.getElementById('seal') as HTMLButtonElement
  const flap = intro.querySelector<HTMLElement>('.flap')!
  const letter = intro.querySelector<HTMLElement>('.letter')!

  // Lock scrolling; pad for the scrollbar we hide so nothing shifts on unlock.
  const gutter = window.innerWidth - root.clientWidth
  root.classList.add('is-locked')
  if (gutter > 0) document.body.style.paddingRight = `${gutter}px`
  lenis?.stop()

  if (!reduced) {
    // Arrival: the envelope settles onto the table.
    gsap.from('.envelope-wrap', { y: 18, autoAlpha: 0, duration: 0.8, ease: 'emilOut' })
    gsap.from('.intro-copy > *', {
      y: 8,
      autoAlpha: 0,
      filter: 'blur(4px)',
      duration: 0.6,
      ease: 'emilOut',
      stagger: 0.08,
      delay: 0.25,
      clearProps: 'filter',
    })
  }

  let opened = false
  let touchY = 0
  const onWheel = (e: WheelEvent) => e.deltaY > 2 && open()
  const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY)
  const onTouchMove = (e: TouchEvent) => touchY - e.touches[0].clientY > 16 && open()
  const onKey = (e: KeyboardEvent) => {
    if (e.target === seal || !['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) return
    e.preventDefault()
    open()
  }
  window.addEventListener('wheel', onWheel, { passive: true })
  intro.addEventListener('touchstart', onTouchStart, { passive: true })
  intro.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('keydown', onKey)
  seal.addEventListener('click', open)

  function detach() {
    window.removeEventListener('wheel', onWheel)
    intro.removeEventListener('touchstart', onTouchStart)
    intro.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('keydown', onKey)
    seal.removeEventListener('click', open)
  }

  function finish() {
    root.classList.remove('is-locked')
    document.body.style.paddingRight = ''
    root.classList.add('is-open')
    intro.hidden = true
    lenis?.start()
    ScrollTrigger.refresh()
    document.querySelector<HTMLElement>('#hero h1')?.focus({ preventScroll: true })
  }

  function open() {
    if (opened) return
    opened = true
    detach()
    intro.classList.add('is-opening')
    const tl = gsap.timeline({ defaults: { ease: 'emilOut' } })

    if (reduced) {
      tl.to(intro, { autoAlpha: 0, duration: 0.4, ease: 'none' }, 0).add(hero(), 0).call(finish, [], 0.4)
      return
    }

    tl.to('.intro-copy', { autoAlpha: 0, y: 8, duration: 0.25 }, 0)
      .add(crack(seal), 0)
      .to(flap, { rotateX: 180, duration: 0.6, ease: 'emilInOut' }, 0.14)
      .set(flap, { zIndex: 0 }, 0.44)
      .to('.envelope-wrap', { y: '7vh', duration: 0.7, ease: 'emilInOut', overwrite: 'auto' }, 0.4)
      .to(letter, { yPercent: -54, duration: 0.6 }, 0.5)
      .to(intro.querySelectorAll('.env-part'), { yPercent: 60, autoAlpha: 0, duration: 0.4 }, 0.98)
      .to(letter, { scale: 1.1, autoAlpha: 0, filter: 'blur(8px)', duration: 0.5 }, 1.02)
      .to(['.intro-bg', '.intro .petals'], { autoAlpha: 0, duration: 0.55 }, 0.98)
      .add(hero(), 0.85)
      .call(finish, [], 1.55)
  }
}
