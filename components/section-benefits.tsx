import Link from "next/link"

function SparkLine({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M1 22 C 15 10, 25 25, 40 16 S 64 27, 78 18 S 100 23, 119 12"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M1 22 C 15 10, 25 25, 40 16 S 64 27, 78 18 S 100 23, 119 12 L 119 32 L 1 32 Z" fill="url(#sparkGrad)" />
    </svg>
  )
}

function MiniBars() {
  const bars = [14, 10, 18, 12, 20, 9, 22, 14, 24, 12, 18, 26]
  return (
    <div className="grid grid-cols-12 items-end gap-1 h-16">
      {bars.map((h, i) => (
        <div key={i} className="rounded-full bg-purple-300/80" style={{ height: `${h * 2}px` }} aria-hidden="true" />
      ))}
    </div>
  )
}

function MiniLineCard() {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-2 hover:shadow-md transition-shadow">
      <div className="text-[9px] text-muted-foreground mb-1.5 font-medium">Over time</div>
      <div className="relative">
        <SparkLine className="h-12 w-full" />
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2" aria-hidden="true">
          <div className="h-8 w-[2px] bg-purple-300/70 rounded-full"></div>
          <div className="mt-0.5 text-[9px] text-muted-foreground text-center font-medium">March</div>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-5 text-center text-[9px] text-muted-foreground">
        <span>Jan</span>
        <span>Feb</span>
                  <span className="text-purple-300 font-medium">Mar</span>
        <span>Apr</span>
        <span>May</span>
      </div>
    </div>
  )
}

export function SectionBenefits() {
  return (
    <section aria-labelledby="benefits-title" className="py-24 md:py-32 relative">
      {/* Dark background like the image */}
      <div className="absolute inset-0 bg-black"></div>
      <div className="absolute inset-0 hero-grid opacity-5"></div>
      
      <div className="container mx-auto px-4 relative">
        <header className="mx-auto max-w-4xl text-center mb-20">
          <h2 id="benefits-title" className="text-4xl md:text-6xl font-bold text-balance mb-6 animate-slide-up" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="gradient-text animate-text-shimmer" style={{
              background: 'linear-gradient(135deg, #a78bfa, #67e8f9, #a78bfa)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Next-Gen AI Chatbot</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s', fontFamily: 'var(--font-body)' }}>
            Deliver instant answers, seamless multimodal support, and powerful analytics
          </p>
        </header>

        <div className="grid gap-8 lg:gap-12 md:grid-cols-3">
          {/* Card 1 - Instant Answers */}
          <div className="group rounded-3xl relative overflow-hidden animate-slide-in-left min-h-[400px] p-6 md:p-8 glassmorphism-card hover-glow neon-glow" style={{ animationDelay: '0.3s' }}>
            {/* Magical particle background */}
            <div className="absolute inset-0 bg-black"></div>
            <div className="absolute inset-0 opacity-60">
              {/* Golden particles scattered across */}
              <div className="absolute top-4 left-8 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
              <div className="absolute top-12 left-16 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute top-20 left-12 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-8 right-20 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              <div className="absolute top-16 right-12 w-1 h-1 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-24 right-8 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
              <div className="absolute top-32 left-20 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
              <div className="absolute top-40 right-16 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
              <div className="absolute top-48 left-24 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
              <div className="absolute top-56 right-24 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="absolute top-64 left-16 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '1.8s' }}></div>
              <div className="absolute top-72 right-20 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.2s' }}></div>
              <div className="absolute top-80 left-12 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></div>
              <div className="absolute top-88 right-8 w-1.5 h-1.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '2.8s' }}></div>
              <div className="absolute top-96 left-28 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.4s' }}></div>
              <div className="absolute top-104 right-12 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '3.2s' }}></div>
              <div className="absolute top-112 left-20 w-1 h-1 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
              <div className="absolute top-120 right-16 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.1s' }}></div>
            </div>
            
            {/* Golden light source from top-center */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-radial from-purple-300/40 via-purple-300/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-radial from-purple-300/30 via-purple-300/15 to-transparent rounded-full blur-xl"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-radial from-purple-300/20 via-purple-300/10 to-transparent rounded-full blur-lg"></div>
            
            {/* Enhanced glow effect like the login form */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-300/20 to-transparent"></div>
            
            {/* Internal card effects like the login form */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/15 blur-lg"></div>
            
            {/* Left corner light effect like the login form */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-purple-300/20 via-purple-300/10 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-radial from-white/15 via-white/5 to-transparent rounded-full blur-xl"></div>
            
            {/* Neon golden glow effect from top-left corner */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-radial from-purple-300/30 via-purple-300/15 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-radial from-purple-300/25 via-purple-300/10 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-radial from-purple-300/20 via-purple-300/5 to-transparent rounded-full blur-xl"></div>
            
            {/* Dotted pattern on the right side like the login form */}
            <div className="absolute top-4 right-4 w-16 h-16 opacity-30">
              <div className="w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '8px 8px'
              }}></div>
            </div>
            
            {/* Widget section */}
            <div className="mb-6 relative z-10">
              <div className="rounded-xl glassmorphism-widget px-4 py-3 relative">
                {/* Internal widget glow effects */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 blur-sm"></div>
                <div className="text-xs text-gray-400 mb-1 font-medium" style={{ fontFamily: 'var(--font-accent)' }}>Response time</div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>40,420</div>
                  <div className="h-6 w-16">
                    <SparkLine className="h-full w-full" />
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  20% <span className="text-purple-300 font-semibold">▲</span> vs Fast month
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-purple-300 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Instant Answers</h3>
              <p className="text-gray-300 leading-relaxed text-base mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                Reply to visitors instantly with AI trained on your FAQs, articles, and policies. No setup or manual training needed. Just connect and go.
              </p>
              <Link
                href="#"
                className="inline-flex items-center gap-1 text-purple-300 font-semibold hover:gap-2 transition-all underline text-sm"
                aria-label="Learn more about Instant Answers"
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                Learn more <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Card 2 - Multimodal Support */}
          <div className="group rounded-3xl relative overflow-hidden animate-bounce-in min-h-[400px] p-6 md:p-8 glassmorphism-card hover-glow neon-glow" style={{ animationDelay: '0.5s' }}>
            {/* Magical particle background */}
            <div className="absolute inset-0 bg-black"></div>
            <div className="absolute inset-0 opacity-60">
              {/* Golden particles scattered across */}
              <div className="absolute top-6 left-10 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
              <div className="absolute top-14 left-18 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></div>
              <div className="absolute top-22 left-14 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
              <div className="absolute top-10 right-22 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.7s' }}></div>
              <div className="absolute top-18 right-14 w-1 h-1 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '2.2s' }}></div>
              <div className="absolute top-26 right-10 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-34 left-22 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.7s' }}></div>
              <div className="absolute top-42 right-18 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '1.4s' }}></div>
              <div className="absolute top-50 left-26 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '3.2s' }}></div>
              <div className="absolute top-58 right-26 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute top-66 left-18 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-74 right-22 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.4s' }}></div>
              <div className="absolute top-82 left-14 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
              <div className="absolute top-90 right-10 w-1.5 h-1.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
              <div className="absolute top-98 left-30 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.6s' }}></div>
              <div className="absolute top-106 right-14 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '3.4s' }}></div>
              <div className="absolute top-114 left-22 w-1 h-1 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '1.1s' }}></div>
              <div className="absolute top-122 right-18 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.3s' }}></div>
            </div>
            
            {/* Golden light source from top-center */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-radial from-purple-300/40 via-purple-300/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-radial from-purple-300/30 via-purple-300/15 to-transparent rounded-full blur-xl"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-radial from-purple-300/20 via-purple-300/10 to-transparent rounded-full blur-lg"></div>
            
            {/* Enhanced glow effect like the login form */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-300/20 to-transparent"></div>
            
            {/* Internal card effects like the login form */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/15 blur-lg"></div>
            
            {/* Left corner light effect like the login form */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-purple-300/20 via-purple-300/10 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-radial from-white/15 via-white/5 to-transparent rounded-full blur-xl"></div>
            
            {/* Neon golden glow effect from top-left corner */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-radial from-purple-300/30 via-purple-300/15 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-radial from-purple-300/25 via-purple-300/10 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-radial from-purple-300/20 via-purple-300/5 to-transparent rounded-full blur-xl"></div>
            
            {/* Dotted pattern on the right side like the login form */}
            <div className="absolute top-4 right-4 w-16 h-16 opacity-30">
              <div className="w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '8px 8px'
              }}></div>
            </div>
            
            {/* Widget section */}
            <div className="mb-6 relative z-10">
              <div className="rounded-xl glassmorphism-widget px-4 py-3 relative">
                {/* Internal widget glow effects */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 blur-sm"></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-400 font-medium" style={{ fontFamily: 'var(--font-accent)' }}>Income Analysis</div>
                  <div className="text-xs text-purple-300 font-semibold">↑ 12.7% this month</div>
                </div>
                <div className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>$10,890</div>
                <div className="mt-3">
                  <MiniBars />
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-purple-300 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Multimodal Support</h3>
              <p className="text-gray-300 leading-relaxed text-base mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                Handle text, voice, and image queries seamlessly in one place. Give users natural, human-like help in their preferred language and channel.
              </p>
              <Link
                href="#"
                className="inline-flex items-center gap-1 text-purple-300 font-semibold hover:gap-2 transition-all underline text-sm"
                aria-label="Learn more about Multimodal Support"
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                Learn more <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Card 3 - Deep Analytics & Insights */}
          <div className="group rounded-3xl relative overflow-hidden animate-slide-in-right min-h-[400px] p-6 md:p-8 glassmorphism-card hover-glow neon-glow" style={{ animationDelay: '0.7s' }}>
            {/* Magical particle background */}
            <div className="absolute inset-0 bg-black"></div>
            <div className="absolute inset-0 opacity-60">
              {/* Golden particles scattered across */}
              <div className="absolute top-5 left-12 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
              <div className="absolute top-13 left-20 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              <div className="absolute top-21 left-16 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.1s' }}></div>
              <div className="absolute top-9 right-24 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.6s' }}></div>
              <div className="absolute top-17 right-16 w-1 h-1 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '2.1s' }}></div>
              <div className="absolute top-25 right-12 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
              <div className="absolute top-33 left-24 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.6s' }}></div>
              <div className="absolute top-41 right-20 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '1.3s' }}></div>
              <div className="absolute top-49 left-28 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '3.1s' }}></div>
              <div className="absolute top-57 right-28 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="absolute top-65 left-20 w-0.5 h-0.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '1.9s' }}></div>
              <div className="absolute top-73 right-24 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.3s' }}></div>
              <div className="absolute top-81 left-16 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
              <div className="absolute top-89 right-12 w-1.5 h-1.5 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '2.9s' }}></div>
              <div className="absolute top-97 left-32 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              <div className="absolute top-105 right-16 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '3.3s' }}></div>
              <div className="absolute top-113 left-24 w-1 h-1 bg-purple-300/70 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-121 right-20 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2.2s' }}></div>
            </div>
            
            {/* Golden light source from top-center */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-radial from-purple-300/40 via-purple-300/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-radial from-purple-300/30 via-purple-300/15 to-transparent rounded-full blur-xl"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-radial from-purple-300/20 via-purple-300/10 to-transparent rounded-full blur-lg"></div>
            
            {/* Enhanced glow effect like the login form */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-300/20 to-transparent"></div>
            
            {/* Internal card effects like the login form */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/15 blur-lg"></div>
            
            {/* Left corner light effect like the login form */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-purple-300/20 via-purple-300/10 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-radial from-white/15 via-white/5 to-transparent rounded-full blur-xl"></div>
            
            {/* Neon golden glow effect from top-left corner */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-radial from-purple-300/30 via-purple-300/15 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-radial from-purple-300/25 via-purple-300/10 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-radial from-purple-300/20 via-purple-300/5 to-transparent rounded-full blur-xl"></div>
            
            {/* Dotted pattern on the right side like the login form */}
            <div className="absolute top-4 right-4 w-16 h-16 opacity-30">
              <div className="w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '8px 8px'
              }}></div>
            </div>
            
            {/* Widget section */}
            <div className="mb-6 relative z-10">
              <div className="rounded-xl glassmorphism-widget px-4 py-3 relative">
                {/* Internal widget glow effects */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 blur-sm"></div>
                <div className="text-xs text-gray-400 mb-2 font-medium" style={{ fontFamily: 'var(--font-accent)' }}>Over time</div>
                <div className="flex items-center justify-center mb-3">
                  <div className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>March</div>
                </div>
                <div className="grid grid-cols-5 text-center text-xs text-gray-400 gap-1">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span className="text-purple-300 font-medium">Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-purple-300 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Deep Analytics & Insights</h3>
              <p className="text-gray-300 leading-relaxed text-base mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                Get real-time dashboards with emotion heatmaps, performance metrics, and trend analysis turning every chat into actionable business intelligence.
              </p>
              <Link
                href="#"
                className="inline-flex items-center gap-1 text-purple-300 font-semibold hover:gap-2 transition-all underline text-sm"
                aria-label="Learn more about Deep Analytics & Insights"
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                Learn more <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            
            {/* Small star icon in bottom-right corner */}
            <div className="absolute bottom-4 right-4 w-4 h-4 text-gray-400 opacity-60">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
