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
        "group relative flex flex-col rounded-2xl border text-foreground transition-all duration-300",
        "bg-card border-border",
        plan.featured ? "border-primary shadow-lg" : "hover:border-primary/50 hover:shadow-md",
      ].join(" ")}
    >
      {/* Header bar */}
      <div className="relative rounded-t-2xl bg-primary px-6 pt-6 pb-4 text-primary-foreground">
        <div className="flex items-baseline justify-between">
          <div className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{plan.name}</div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium" style={{ fontFamily: 'var(--font-accent)' }}>
            {plan.period}
          </span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{plan.price}</span>
          <span className="pb-1 text-sm opacity-90" style={{ fontFamily: 'var(--font-body)' }}>per month</span>
        </div>

        <p className="mt-3 text-sm opacity-90 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>{plan.blurb}</p>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="space-y-3">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground leading-relaxed">{f.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <Button
            className={[
              "w-full rounded-lg py-3 text-base font-medium transition-all duration-200",
              plan.featured 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
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
    <section aria-labelledby="pricing-heading" className="py-16 md:py-24 relative bg-background">
      
      <div className="container mx-auto max-w-7xl px-4 relative">
        {/* Title */}
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
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
