import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Feature = {
  label: string
}

type Plan = {
  name: string
  price: string
  period: string
  blurb: string
  features: Feature[]
  featured?: boolean
}

function PricingCard({
  plan,
}: {
  plan: Plan
}) {
  return (
    <div
      className={[
        "group relative flex flex-col rounded-3xl glass-effect border text-foreground hover-lift transition-all duration-500",
        "border-border/50",
        plan.featured ? "ring-2 ring-primary/50 shadow-2xl scale-105" : "shadow-lg hover:shadow-xl",
      ].join(" ")}
    >
      {/* Header bar */}
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-primary to-accent px-8 pt-8 pb-6 text-primary-foreground">
        <div className="flex items-baseline justify-between">
          <div className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{plan.name}</div>
          <span className="rounded-full glass-effect px-3 py-1 text-sm font-medium tracking-wide" style={{ fontFamily: 'var(--font-accent)' }}>
            {plan.period}
          </span>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <span className="text-5xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{plan.price}</span>
          <span className="pb-2 text-sm opacity-90" style={{ fontFamily: 'var(--font-body)' }}>per month</span>
        </div>

        <p className="mt-4 text-sm opacity-90 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>{plan.blurb}</p>

        {/* Decorative corner accents */}
        <span aria-hidden className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-white/15" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-6 p-8">
        <div className="space-y-4">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <CheckCircle2 aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
              <p className="text-muted-foreground leading-relaxed">{f.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <Button
            className={[
              "w-full rounded-2xl py-4 text-lg font-semibold transition-all duration-300",
              plan.featured 
                ? "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105" 
                : "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50 hover:border-primary/30",
            ].join(" ")}
            variant={plan.featured ? "default" : "secondary"}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SectionPricing() {
  const plans: Plan[] = [
    {
      name: "Standard",
      price: "$9",
      period: "per month",
      blurb: "Includes annual-billing support tools for growing teams.",
      features: [
        { label: "Live chat for support" },
        { label: "Team inboxes" },
        { label: "Ticketing workflows" },
        { label: "Saved replies" },
        { label: "Workload management rules" },
        { label: "Reporting dashboards" },
        { label: "Role-based permissions" },
      ],
    },
    {
      name: "Plus",
      price: "$19",
      period: "per month",
      blurb: "All Standard features and more for growing teams.",
      featured: true,
      features: [
        { label: "Outbound email and in-product messaging" },
        { label: "Pro Insights & notifications" },
        { label: "Custom bots" },
        { label: "Message themes" },
        { label: "Multi-channel campaigns" },
        { label: "Audience segments & control groups" },
        { label: "Message versioning" },
      ],
    },
    {
      name: "Company",
      price: "$59",
      period: "per month",
      blurb: "All Plus features and enterprise controls.",
      features: [
        { label: "Conversational chatbots" },
        { label: "SLA-based notifications" },
        { label: "Advanced automation rules" },
        { label: "Workload management" },
        { label: "Audit logging" },
        { label: "Advanced security" },
        { label: "Dedicated success manager" },
      ],
    },
  ]

  return (
    <section aria-labelledby="pricing-heading" className="py-24 md:py-32 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"></div>
      <div className="absolute inset-0 hero-grid opacity-10"></div>
      
      <div className="container mx-auto max-w-7xl px-4 relative">
        {/* Eyebrow */}
        <div className="mb-6 flex justify-center">
          <span className="rounded-full glass-effect border border-primary/20 px-4 py-2 text-sm font-semibold text-primary">
            💰 Pricing
          </span>
        </div>

        {/* Title */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 id="pricing-heading" className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-slide-up" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="gradient-text animate-text-shimmer" style={{
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4, #8b5cf6)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Simple, Transparent Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s', fontFamily: 'var(--font-body)' }}>
            Choose the perfect plan for your business needs. No hidden fees, no surprises.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-10 xl:grid-cols-3">
          {plans.map((plan, index) => (
            <div key={plan.name} className="animate-bounce-in" style={{ animationDelay: `${0.4 + index * 0.2}s` }}>
              <PricingCard plan={plan} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
