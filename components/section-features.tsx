export default function SectionFeatures() {
  return (
    <section aria-labelledby="features-heading" className="relative mx-auto max-w-7xl px-4 py-8 md:py-8">
      <div className="text-center mb-10 md:mb-14">
        <h2
          id="features-heading"
          className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground text-balance"
        >
          Push your ideas to product with ease.
        </h2>
        <p className="mt-4 text-sm md:text-base text-muted-foreground">
          Led ask possible mistress relation elegance eat likewise debating.
          <br className="hidden md:block" />
          By message or am nothing amongst chiefly address.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Card 1 - Autopilot */}
        <article className="relative rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
          {/* Floating mini-cards */}
          <div className="pointer-events-none">
            <div className="absolute -top-6 left-6 w-56 rounded-lg border border-border bg-background/90 shadow-md backdrop-blur-sm">
              <div className="px-4 py-3">
                <p className="text-xs text-muted-foreground">New customers</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">5,026</span>
                  <button aria-label="More" className="h-5 w-5 rounded-sm text-muted-foreground">
                    {"\u22EE"}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-emerald-500 font-medium">56%</span>
                  <span className="text-muted-foreground">▲</span>
                </div>
              </div>
            </div>

            <div className="absolute top-10 left-24 w-60 rounded-lg border border-border bg-background/90 shadow-md backdrop-blur-sm">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Response time</p>
                  <button aria-label="More" className="h-5 w-5 rounded-sm text-muted-foreground">
                    {"\u22EE"}
                  </button>
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">40,420</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-emerald-500 font-medium">20% ↑</span>
                  <span className="text-muted-foreground">vs Fast month</span>
                </div>
                {/* Micro line chart */}
                <svg viewBox="0 0 120 28" className="mt-2 h-8 w-full" aria-hidden="true">
                  <path
                    d="M0 18 C 10 14, 20 22, 30 16 S 50 10, 60 15 80 25, 90 14 110 18, 120 12"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="pt-28 md:pt-32">
            <h3 className="text-xl font-semibold text-foreground">Autopilot</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Empower our AI engine to manage the purchase and sale of reserved instances, effectively optimizing your
              AWS expenditure.
            </p>
            <button className="group mt-6 inline-flex items-center gap-2 text-primary font-medium">
              Learn more
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                {"\u203A"}
              </span>
            </button>
          </div>
        </article>

        {/* Card 2 - Highlighted */}
        <article className="relative rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm ring-1 ring-primary/10">
          {/* Subtle blue glow */}
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(120px_80px_at_50%_0%,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="relative">
            <div className="rounded-lg border border-border bg-background p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Income Analysis</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-500">12.7% ↑</span>
                  <span className="text-muted-foreground">This month</span>
                </div>
              </div>
              <div className="mt-1 text-2xl font-semibold text-foreground">$10,890</div>

              {/* Vertical bars */}
              <div className="mt-4 grid grid-cols-12 items-end gap-1">
                {[35, 26, 30, 20, 38, 22, 34, 18, 36, 28, 26, 40].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="inline-block w-full rounded-sm bg-primary/80"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
                <span>Desktop</span>
                <span>Mobile</span>
                <span>Other</span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-foreground">Continuous Optimization</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Our AI engine consistently observes and adapts to your usage behaviors, uncovering fresh savings
                possibilities.
              </p>
              <button className="group mt-6 inline-flex items-center gap-2 text-primary font-medium">
                Learn more
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  {"\u203A"}
                </span>
              </button>
            </div>
          </div>
        </article>

        {/* Card 3 - Commitment-free */}
        <article className="relative rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="rounded-lg border border-border bg-background p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Over time</p>
              <p className="text-xs font-semibold text-foreground">$73,094.23</p>
            </div>

            {/* Line chart with selected pill */}
            <div className="mt-3">
              <svg viewBox="0 0 300 90" className="h-24 w-full" aria-hidden>
                <path
                  d="M0 60 C 30 50, 60 55, 90 52 C 120 50, 150 62, 180 40 C 200 45, 230 30, 260 48 C 280 55, 300 50, 300 50"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                />
                {/* selected point + vertical marker */}
                <line x1="150" x2="150" y1="20" y2="80" stroke="hsl(var(--primary))" strokeDasharray="2 3" />
                <circle cx="150" cy="62" r="5" fill="hsl(var(--primary))" />
              </svg>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Jan</span>
                <span>Feb</span>
                <span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">March</span>
                </span>
                <span>Apr</span>
                <span>May</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-foreground">Commitment-free</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Embrace the advantages of extended AWS pricing without entanglements.
            </p>
            <button className="group mt-6 inline-flex items-center gap-2 text-primary font-medium">
              Learn more
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                {"\u203A"}
              </span>
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
