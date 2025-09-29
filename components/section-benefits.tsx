import Link from "next/link"

function SparkLine({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M1 22 C 15 10, 25 25, 40 16 S 64 27, 78 18 S 100 23, 119 12"
        stroke="hsl(var(--primary))"
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
        <div key={i} className="rounded-full bg-primary/80" style={{ height: `${h * 2}px` }} aria-hidden="true" />
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
          <div className="h-8 w-[2px] bg-primary/70 rounded-full"></div>
          <div className="mt-0.5 text-[9px] text-muted-foreground text-center font-medium">March</div>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-5 text-center text-[9px] text-muted-foreground">
        <span>Jan</span>
        <span>Feb</span>
        <span className="text-primary font-medium">Mar</span>
        <span>Apr</span>
        <span>May</span>
      </div>
    </div>
  )
}

export function SectionBenefits() {
  return (
    <section aria-labelledby="benefits-title" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <header className="mx-auto max-w-3xl text-center">
          <h2 id="benefits-title" className="text-3xl/tight md:text-5xl font-semibold text-balance">
            Next-Gen AI Chatbot
          </h2>
          <p className="mt-4 text-muted-foreground">
            Deliver instant answers, seamless multimodal support, and powerful analytics
          </p>
        </header>

        <div className="mt-12 grid gap-8 lg:gap-12 md:grid-cols-3">
          {/* Card 1 - Instant Answers */}
          <div className="group rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300 p-8 md:p-10 min-h-[400px]">
            {/* Widget section */}
            <div className="mb-6">
              <div className="rounded-xl border bg-card shadow-md px-2 py-1.5">
                <div className="text-[10px] text-muted-foreground">Response time</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="text-xs font-semibold">40,420</div>
                  <div className="h-3 w-12">
                    <SparkLine className="h-full w-full" />
                  </div>
                </div>
                <div className="text-[9px] text-muted-foreground">
                  20% <span className="text-emerald-500">▲</span> vs Fast month
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xl md:text-2xl font-semibold group-hover:text-primary transition-colors">Instant Answers</h3>
              <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                Reply to visitors instantly with AI trained on your FAQs, articles, and policies no setup or manual training needed. Just connect and go.
              </p>
              <Link
                href="#"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all group-hover:underline"
                aria-label="Learn more about Instant Answers"
              >
                Learn more <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Card 2 - Multimodal Support */}
          <div className="group rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300 p-8 md:p-10 ring-1 ring-primary/20 hover:ring-primary/40 min-h-[400px]">
            {/* Widget section */}
            <div className="mb-6">
              <div className="rounded-xl border bg-card shadow-md p-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="text-[10px] text-muted-foreground">Income Analysis</div>
                  <div className="text-[9px] text-emerald-500">↑ 12.7% this month</div>
                </div>
                <div className="text-xs font-semibold">$10,890</div>
                <div className="mt-3">
                  <MiniBars />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xl md:text-2xl font-semibold group-hover:text-primary transition-colors">Multimodal Support</h3>
              <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                Handle text, voice, and image queries seamlessly in one place. Give users natural, human-like help in their preferred language and channel.
              </p>
              <Link
                href="#"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all group-hover:underline"
                aria-label="Learn more about Multimodal Support"
              >
                Learn more <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Card 3 - Deep Analytics & Insights */}
          <div className="group rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300 p-8 md:p-10 min-h-[400px]">
            {/* Widget section */}
            <div className="mb-6">
              <MiniLineCard />
            </div>

            <div className="mt-4">
              <h3 className="text-xl md:text-2xl font-semibold group-hover:text-primary transition-colors">Deep Analytics & Insights</h3>
              <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                Get real-time dashboards with emotion heatmaps, performance metrics, and trend analysis turning every chat into actionable business intelligence.
              </p>
              <Link
                href="#"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all group-hover:underline"
                aria-label="Learn more about Deep Analytics & Insights"
              >
                Learn more <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
