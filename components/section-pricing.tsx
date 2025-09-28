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
        "relative flex flex-col rounded-xl border bg-card text-foreground shadow-sm",
        "border-border",
        plan.featured ? "ring-1 ring-primary shadow-lg" : "shadow-[0_1px_0_rgba(0,0,0,0.02)]",
      ].join(" ")}
    >
      {/* Header bar */}
      <div className="relative overflow-hidden rounded-t-xl bg-foreground px-6 pt-6 pb-4 text-background">
        <div className="flex items-baseline justify-between">
          <div className="text-sm/6 font-medium opacity-80">{plan.name}</div>
          <span className="rounded-full bg-background/10 px-2 py-0.5 text-[11px] font-medium tracking-wide">
            {plan.period}
          </span>
        </div>

        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-semibold tabular-nums">{plan.price}</span>
          <span className="pb-1 text-xs/5 opacity-80">per month</span>
        </div>

        <p className="mt-3 text-xs/5 opacity-80">{plan.blurb}</p>

        {/* Decorative primary corner accents */}
        <span aria-hidden className="pointer-events-none absolute -left-4 -top-4 size-16 rounded-full bg-primary/20" />
        <span aria-hidden className="pointer-events-none absolute -right-5 -top-5 size-16 rounded-full bg-primary/30" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="space-y-3">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <Button
            className={[
              "w-full rounded-full",
              plan.featured ? "" : "bg-background text-foreground border border-border hover:bg-muted",
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

export default function SectionPricing() {
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
    <section aria-labelledby="pricing-heading" className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Eyebrow */}
        <div className="mb-3 flex justify-center">
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Pricing
          </span>
        </div>

        {/* Title */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="pricing-heading" className="text-pretty text-3xl font-semibold tracking-tight md:text-4xl">
            Build Stronger Customer Relationships
            <br />
            With Primchat
          </h2>
        </div>

        {/* Cards */}
        <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 lg:gap-6 xl:mt-14 xl:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  )
}
