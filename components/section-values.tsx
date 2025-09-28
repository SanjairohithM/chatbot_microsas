"use client"

import type { ElementType } from "react"
import { cn } from "@/lib/utils"
import { Lightbulb, TrendingUp, ShieldCheck, Users, Workflow, Smile } from "lucide-react"

type ValueItem = {
  title: string
  description: string
  icon: ElementType
  featured?: boolean
}

const VALUES: ValueItem[] = [
  {
    title: "Innovation",
    description: "Building an enterprise doesn’t need nightmare or cost your thousands. Felix is purpose built.",
    icon: Lightbulb,
    featured: true,
  },
  {
    title: "Growth",
    description: "We ship improvements continuously so your business compounds over time.",
    icon: TrendingUp,
  },
  {
    title: "Ownership",
    description: "Clear accountability and autonomy so decisions happen quickly.",
    icon: ShieldCheck,
  },
  {
    title: "Team Work",
    description: "Transparent collaboration that keeps everyone aligned and moving.",
    icon: Users,
  },
  {
    title: "Commitment",
    description: "We keep promises and measure progress to outcomes, not output.",
    icon: Workflow,
  },
  {
    title: "Positivity",
    description: "A calm, constructive environment that brings out the best in teams.",
    icon: Smile,
  },
]

export function SectionValues() {
  return (
    <section id="values" aria-labelledby="values-heading" className="relative sm:py-5">
      <div className="container mx-auto px-4">
        <header className="text-center">
          <h2 id="values-heading" className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
            Our Values
          </h2>
        </header>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {VALUES.map((item) => (
            <ValueCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ValueCard({ item }: { item: ValueItem }) {
  const Icon = item.icon
  const featured = item.featured

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card text-card-foreground p-10 shadow-sm transition-shadow",
        "flex flex-col items-center text-center",
        featured
          ? "ring-1 ring-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-md"
          : "hover:shadow-md",
      )}
    >
      {/* Icon chip */}
      <div
        aria-hidden="true"
        className={cn(
          "inline-flex size-14 items-center justify-center rounded-2xl",
          "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner",
        )}
      >
        <Icon className="size-6" />
      </div>

      <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
      <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
        Building an enterprise doesn’t need nightmare or cost your thousands. Felix is purpose built.
      </p>
    </article>
  )
}
