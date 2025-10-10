import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 hero-grid"></div>
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40"></div>

      <div className="relative mx-auto max-w-7xl px-4 py-20">
        {/* Announcement */}
        <div className="mx-auto w-fit rounded-full glass-effect border border-primary/20 px-4 py-2 text-sm text-muted-foreground animate-fade-in">
          <span className="font-medium text-primary">✨ New:</span> 
          <span className="ml-2">AI Chat, Voice Integration, Smart Responses</span>
        </div>

        {/* Headline */}
        <div className="mx-auto mt-8 max-w-5xl text-center">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-foreground animate-slide-up leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="block animate-fade-in" style={{ animationDelay: '0.2s' }}>Meet AI-Powered</span>
            <span className="block gradient-text animate-text-shimmer leading-tight" style={{ 
              animationDelay: '0.4s',
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4, #8b5cf6)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              display: 'inline-block',
              position: 'relative',
              zIndex: 10,
              lineHeight: '1.1',
              paddingBottom: '0.1em'
            }}>Intelligent Chatbot</span>
            <span className="block text-4xl md:text-5xl mt-4 text-muted-foreground font-medium animate-fade-in" style={{ animationDelay: '0.6s', fontFamily: 'var(--font-body)' }}>Built for Your Sites</span>
          </h1>
          
          <p className="mt-8 text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.8s', fontFamily: 'var(--font-body)' }}>
            Launch multilingual, emotion-aware AI support bots in minutes, personalize
            every interaction, and manage it all from one intuitive dashboard.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-bounce-in" style={{ animationDelay: '1s' }}>
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-semibold">
              <Link href="#">Get Started Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-primary/30 text-foreground hover:bg-primary/10 transition-all duration-300 px-8 py-4 text-lg">
              <Link href="#">Watch Demo</Link>
            </Button>
          </div>
        </div>

        {/* Device mockup with dashboard image */}
        <div className="relative mx-auto mt-20 max-w-6xl animate-float">
          <div className="relative">
            {/* Enhanced glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-50 animate-pulse-slow"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-accent/10 to-primary/10 rounded-3xl blur-xl opacity-30 animate-glow"></div>
            
            <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl animate-scale-in" style={{ animationDelay: '1.2s' }}>
              <div className="rounded-2xl overflow-hidden">
                <img
                  src="/images/ssadmin.png"
                  alt="AI Chatbot Dashboard Preview"
                  width={1200}
                  height={600}
                  loading="eager"
                  className="block h-auto w-full transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Floating UI callouts */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-8 top-16 hidden lg:block glass-effect rounded-xl px-4 py-3 text-sm shadow-lg animate-bounce-in hover:animate-wiggle" style={{ animationDelay: '1.5s' }}>
                <span className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-accent)' }}>Quick Summary</span>
                <div className="text-xs text-muted-foreground mt-1">AI Insights</div>
              </div>
              <div className="absolute -right-8 top-24 hidden lg:block glass-effect rounded-xl px-4 py-3 text-sm shadow-lg animate-bounce-in hover:animate-wiggle" style={{ animationDelay: '1.8s' }}>
                <span className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-accent)' }}>Improved UI</span>
                <div className="text-xs text-muted-foreground mt-1">Modern Design</div>
              </div>
              <div className="absolute -left-6 bottom-16 hidden lg:block glass-effect rounded-xl px-4 py-3 text-sm shadow-lg animate-bounce-in hover:animate-wiggle" style={{ animationDelay: '2.1s' }}>
                <span className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-accent)' }}>Live Charts</span>
                <div className="text-xs text-muted-foreground mt-1">Real-time Data</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
