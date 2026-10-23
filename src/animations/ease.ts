import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

// Emil Kowalski's curves. Built-in eases are too weak to feel intentional.
// emilOut: anything entering or leaving — starts fast, so it feels responsive.
CustomEase.create('emilOut', 'M0,0 C0.23,1 0.32,1 1,1')
// emilInOut: things moving or morphing while on screen.
CustomEase.create('emilInOut', 'M0,0 C0.77,0 0.175,1 1,1')
