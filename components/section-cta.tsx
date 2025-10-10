"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"

export function SectionCta() {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  
  // Refs for the animated shapes
  const shape1Ref = useRef<HTMLDivElement>(null)
  const shape2Ref = useRef<HTMLDivElement>(null)
  const shape3Ref = useRef<HTMLDivElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  useEffect(() => {
    // Create the continuous linear movement animation
    const tl = gsap.timeline({ repeat: -1 })
    
    // Initial positions
    gsap.set([shape1Ref.current, shape2Ref.current, shape3Ref.current, circleRef.current], {
      y: 0
    })

    // Animation sequence: 1,2,3 then 2,3,1 then 3,1,2
    tl.to([shape1Ref.current, shape2Ref.current, shape3Ref.current, circleRef.current], {
      y: -100,
      duration: 2,
      ease: "none"
    })
    .to([shape2Ref.current, shape3Ref.current, shape1Ref.current, circleRef.current], {
      y: -200,
      duration: 2,
      ease: "none"
    })
    .to([shape3Ref.current, shape1Ref.current, shape2Ref.current, circleRef.current], {
      y: -300,
      duration: 2,
      ease: "none"
    })
    .set([shape1Ref.current, shape2Ref.current, shape3Ref.current, circleRef.current], {
      y: 0
    })

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <section aria-labelledby="cta-title" className="w-full py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div
          className="
            relative overflow-hidden rounded-3xl
            bg-primary text-primary-foreground
            px-6 py-8 md:px-12 md:py-12
          "
          role="region"
          aria-label="Subscribe to updates"
        >
          {/* Left decorative shapes with GSAP animation */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <div
              ref={shape1Ref}
              className="absolute -left-10 -top-6 rotate-345 rounded-xl bg-white/15 blur-[0.5px]"
              style={{ width: 260, height: 80 }}
            />
            <div
              ref={shape2Ref}
              className="absolute left-6 top-24 rotate-345 rounded-xl bg-white/12"
              style={{ width: 220, height: 72 }}
            />
            <div
              ref={shape3Ref}
              className="absolute -left-4 top-56 rotate-345 rounded-xl bg-white/10"
              style={{ width: 260, height: 84 }}
            />
            <div 
              ref={circleRef}
              className="absolute left-44 top-6 rounded-full bg-white/20" 
              style={{ width: 54, height: 54 }} 
            />
          </div>

          {/* Content */}
          <div className="relative grid items-center gap-6 md:grid-cols-2">
            {/* spacer cell on the left to mirror design where shapes live */}
            <div className="h-24 md:h-40" />

            <div className="flex flex-col items-start gap-6">
              <h2 id="cta-title" className="text-pretty text-2xl font-semibold leading-tight md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                <span className="text-primary-foreground/90">Build Stronger </span>
                <span className="font-extrabold text-primary-foreground">Customer</span>
                <span className="text-primary-foreground/90"> Relationships With </span>
                <span className="font-extrabold text-black">omnixchat</span>
              </h2>

              <form onSubmit={onSubmit} className="flex w-full max-w-md items-center gap-3">
                <label htmlFor="cta-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="cta-email"
                  type="email"
                  required
                  placeholder="Enter your email."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full flex-1 rounded-full border border-white/20
                    bg-background text-foreground
                    px-5 py-3.5 text-sm outline-none
                    placeholder:text-foreground/50
                    focus:border-white/40
                  "
                />
                <button
                  type="submit"
                  className="
                    rounded-full bg-foreground px-6 py-3.5 text-xs font-semibold
                    text-background transition-colors
                    hover:opacity-90
                  "
                >
                  SUBMIT
                </button>
              </form>

              {submitted && (
                <p role="status" className="text-sm text-primary-foreground/80">
                  Thanks! We’ll be in touch soon.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionCta
