
import { useEffect, useRef } from 'react'

export default function useScrollReveal(selector = '[data-reveal]') {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    let ctx
    let cancelled = false

    async function setup() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        gsap.from(selector, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.12,
          scrollTrigger: { trigger: container, start: 'top 80%', once: true },
        })
      }, container)
    }

    setup()

    return () => {
      cancelled = true
      if (ctx) ctx.revert()
    }
  }, [selector])

  return containerRef
}
