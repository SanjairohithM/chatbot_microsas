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
    <div className="grid grid-cols-12 items-end gap-1 h-24">
      {bars.map((h, i) => (
        <div key={i} className="rounded-full bg-primary/80" style={{ height: `${h * 3}px` }} aria-hidden="true" />
      ))}
    </div>
  )
}

function MiniLineCard() {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-4">
      <div className="text-[10px] text-muted-foreground mb-2">Over time</div>
      <div className="relative">
        <SparkLine className="h-20 w-full" />
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2" aria-hidden="true">
          <div className="h-14 w-[2px] bg-primary/70 rounded-full"></div>
          <div className="mt-1 text-[10px] text-muted-foreground text-center">March</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-5 text-center text-[10px] text-muted-foreground">
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
            Push your ideas to product with ease.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Led ask possible mistress relation elegance eat likewise debating. By message or am nothing amongst chiefly
            address.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:gap-8 md:grid-cols-3">
          {/* Card 1 - Autopilot */}
          <article className="relative rounded-2xl border bg-card shadow-sm p-6 md:p-8">
            <div className="absolute -top-6 left-6">
              {/* back widget */}
              <div className="rounded-xl border bg-card shadow-sm px-4 py-3 translate-y-2">
                <div className="text-xs text-muted-foreground">New customers</div>
                <div className="mt-1 text-sm font-semibold tracking-tight">5026</div>
                <div className="text-[10px] text-emerald-500">+56% vs last month</div>
              </div>
              {/* front widget */}
              <div className="rounded-xl border bg-card shadow-md px-4 py-3 -ml-4 mt-2">
                <div className="text-xs text-muted-foreground">Response time</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="text-sm font-semibold">40,420</div>
                  <div className="h-4 w-16">
                    <SparkLine className="h-full w-full" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  20% <span className="text-emerald-500">▲</span> vs Fast month
                </div>
              </div>
            </div>

            <div className="mt-24">
              <h3 className="text-lg md:text-xl font-semibold">Autopilot</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Empower our AI engine to manage the purchase and sale of reserved instances, effectively optimizing your
                AWS expenditure.
              </p>
              <Link
                href="#"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
                aria-label="Learn more about Autopilot"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>

          {/* Card 2 - Emphasized */}
          <article className="relative rounded-2xl border bg-card shadow-sm p-6 md:p-8 ring-1 ring-primary/20">
            <div className="absolute inset-x-6 -top-6">
              <div className="rounded-xl border bg-card shadow-md p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Income Analysis</div>
                  <div className="text-[10px] text-emerald-500">↑ 12.7% this month</div>
                </div>
                <div className="text-sm font-semibold">$10,890</div>
                <div className="mt-3">
                  <MiniBars />
                </div>
              </div>
            </div>

            <div className="mt-28">
              <h3 className="text-lg md:text-xl font-semibold">Continuous Optimization</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Our AI engine consistently observes and adapts to your usage behaviors, uncovering fresh savings
                possibilities.
              </p>
              <Link
                href="#"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
                aria-label="Learn more about Continuous Optimization"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>

          {/* Card 3 - Commitment-free */}
          <article className="relative rounded-2xl border bg-card shadow-sm p-6 md:p-8">
            <div className="absolute inset-x-6 -top-6">
              <MiniLineCard />
            </div>

            <div className="mt-28">
              <h3 className="text-lg md:text-xl font-semibold">Commitment-free</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Embrace the advantages of extended AWS pricing without entanglements.
              </p>
              <Link
                href="#"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
                aria-label="Learn more about Commitment-free"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
