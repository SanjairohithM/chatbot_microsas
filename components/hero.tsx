import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"

export function Hero() {
  return (
    <section className="relative">
      {/* Subtle grid background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/bg-grid.png')] bg-cover bg-center pointer-events-none absolute inset-0 -z-10"></div>

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 md:pt-12 md:pb-12">
        {/* Announcement */}
        <div className="mx-auto w-fit rounded-full border bg-secondary px-3 py-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">New:</span> <span>AI Chat, Voice Integration, Smart Responses</span>
        </div>


          {/* <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex-shrink-0 relative flex items-center justify-center">
              <img 
                src="/anivoice1.svg" 
                alt="Anivoice" 
                className="w-full h-full voice-animated object-contain"
              />
            </div>  */}

        {/* Headline */}
        <div className="mx-auto mt-6 max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl flex items-baseline justify-center gap-4 flex-wrap">
            <span>AI-powered chatbot </span>
           
            <span>has never been smarter</span>
          </h1>
          <p className="mt-4 text-pretty text-muted-foreground md:text-lg leading-relaxed">
            The best way for intelligent conversations, customer support, and automated assistance. Fast responses, all-in-one
            chatbot platform. AI intelligence, every interaction.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="#">Start Chatting</Link>
            </Button>
          </div>
        </div>

        {/* Device mockup with dashboard image */}
        <div className="relative mx-auto mt-12 max-w-5xl">
          <div className="rounded-[1.25rem] border bg-card shadow-xl shadow-black/5 ring-1 ring-black/5">
            <div className="rounded-[1rem] overflow-hidden">
              <img
                src="/images/body-img.jpg"
                alt="Financial analytics dashboard preview"
                width={1200}
                height={400}
                loading="eager"
                className="block h-auto w-full"
              />
            </div>
          </div>

          {/* Floating UI callouts (decorative) */}
          <div aria-hidden="true">
            <div className="absolute -left-6 top-10 hidden md:block rounded-lg border bg-background/90 px-3 py-2 text-xs shadow-sm ring-1 ring-black/5">
              <span className="font-medium text-foreground">Quick Summary</span>
            </div>
            <div className="absolute -right-6 top-16 hidden md:block rounded-lg border bg-background/90 px-3 py-2 text-xs shadow-sm ring-1 ring-black/5">
              <span className="font-medium text-foreground">Improved UI</span>
            </div>
            <div className="absolute -left-4 bottom-10 hidden md:block rounded-lg border bg-background/90 px-3 py-2 text-xs shadow-sm ring-1 ring-black/5">
              <span className="font-medium text-foreground">Live Charts</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
