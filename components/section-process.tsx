import { Button } from "@/components/ui/button"

export function SectionProcess() {
  return (
    <section aria-labelledby="process-title" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            How It Work
          </span>
          <h2 id="process-title" className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Work smarter
            <br className="hidden md:block" />
            with easy access for user..
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Led ask possible mistress relation elegance eat likewise debating. By message or am nothing amongst chiefly
            address.
          </p>
        </div>

        {/* Content */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Left Gradient Card */}
          <article
            className="relative rounded-3xl p-8 md:p-10 text-background shadow-xl ring-1 ring-black/5"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklch, hsl(var(--primary)) 85%, white) 0%, color-mix(in oklch, hsl(var(--primary)) 35%, white) 55%, color-mix(in oklch, hsl(var(--primary)) 0%, white) 100%)",
            }}
          >
            <h3 className="text-2xl md:text-3xl font-semibold leading-tight">
              Our Working
              <br />
              Process - How
              <br />
              We Work For Our
              <br />
              Customers
            </h3>

            <p className="mt-5 max-w-md text-sm/6 opacity-90">
              Resolving neglected sir tolerably but existence conveying for. Day his put off unaffected literature
              partiality inhabiting.
            </p>

            <div className="mt-8">
              <Button
                size="lg"
                className="h-12 rounded-full bg-background text-foreground shadow-md hover:bg-background/90"
              >
                Get Started
              </Button>
            </div>

            {/* Decorative clipped wedge to echo reference */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 h-28 w-36 rounded-tl-3xl opacity-35"
              style={{
                background: "linear-gradient(160deg, color-mix(in oklch, hsl(var(--primary)) 45%, white), transparent)",
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 40% 100%)",
              }}
            />
          </article>

          {/* Steps grid (spans two columns) */}
          <div className="md:col-span-2">
            <div className="grid gap-10 md:grid-cols-2">
              <Step
                number="01"
                title="Create your free account"
                copy="Building defang enterprise doesn't need nightmare or cost your thousands. Duxo is purpose built."
              />
              <Step
                number="02"
                title="Connect your candidate’s"
                copy="Building defang enterprise doesn't need nightmare or cost your thousands. Duxo is purpose built."
                accent
              />
              <Step
                number="03"
                title="Schedule your posts"
                copy="Building defang enterprise doesn't need nightmare or cost your thousands. Duxo is purpose built."
              />
              <Step
                number="04"
                title="Publish & get your planning on point"
                copy="Building defang enterprise doesn't need nightmare or cost your thousands. Duxo is purpose built."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Step({
  number,
  title,
  copy,
  accent = false,
}: {
  number: string
  title: string
  copy: string
  accent?: boolean
}) {
  return (
    <div>
      <div className={["text-4xl font-semibold tracking-tight md:text-5xl", accent ? "text-primary" : ""].join(" ")}>
        {number}
      </div>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{copy}</p>
    </div>
  )
}
