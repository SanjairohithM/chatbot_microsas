"use client"

import type { ElementType } from "react"
import { cn } from "@/lib/utils"
import { Lightbulb, TrendingUp, ShieldCheck, Users, Workflow, Smile } from "lucide-react"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"

type ValueItem = {
  title: string
  description: string
  icon: ElementType
  featured?: boolean
  className?: string
  animationDirection?: "forward" | "reverse"
}

const VALUES: ValueItem[] = [
  {
    title: "Innovation",
    description: "Building an enterprise doesn't need nightmare or cost your thousands. Felix is purpose built.",
    icon: Lightbulb,
    featured: true,
    className: "md:col-span-2",
    animationDirection: "forward",
  },
  {
    title: "Growth",
    description: "We ship improvements continuously so your business compounds over time.",
    icon: TrendingUp,
    className: "md:col-span-1",
    animationDirection: "reverse",
  },
  {
    title: "Ownership",
    description: "Clear accountability and autonomy so decisions happen quickly.",
    icon: ShieldCheck,
    className: "md:col-span-1",
    animationDirection: "forward",
  },
  {
    title: "Team Work",
    description: "Transparent collaboration that keeps everyone aligned and moving.",
    icon: Users,
    className: "md:col-span-2",
    animationDirection: "reverse",
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

        <div className="mt-14">
          <BentoGrid className="max-w-4xl mx-auto">
            {VALUES.map((item) => (
              <div
                key={item.title}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-300 hover:shadow-xl dark:border-white/[0.2] dark:bg-black",
                  "hover:border-transparent hover:p-[4px]",
                  item.className
                )}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 transition-all duration-500 group-hover:opacity-100",
                  item.animationDirection === "reverse" ? "rainbow-train-border-reverse" : "rainbow-train-border"
                )} />
                <div className="relative h-full w-full rounded-lg bg-white dark:bg-black p-4">
                  <BentoGridItem
                    title={item.title}
                    description={item.description}
                    header={<ValueHeader item={item} />}
                    className="border-0 shadow-none"
                    icon={<ValueIcon item={item} />}
                  />
                </div>
              </div>
            ))}
          </BentoGrid>
        </div>
      </div>
    </section>
  )
}

function ValueHeader({ item }: { item: ValueItem }) {
  const featured = item.featured
  
  return (
    <div className={cn(
      "flex flex-1 w-full h-full min-h-[6rem] rounded-xl",
      "dark:bg-dot-white/[0.2] bg-dot-black/[0.2]",
      "[mask-image:radial-gradient(ellipse_at_center,white,transparent)]",
      "border border-transparent dark:border-white/[0.2]",
      featured 
        ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" 
        : "bg-neutral-100 dark:bg-black"
    )}>
      <div className="flex items-center justify-center w-full h-full">
        <div className={cn(
          "inline-flex size-16 items-center justify-center rounded-2xl",
          "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner",
          "backdrop-blur-sm"
        )}>
          <item.icon className="size-8" />
        </div>
      </div>
    </div>
  )
}

function ValueIcon({ item }: { item: ValueItem }) {
  return <item.icon className="h-4 w-4 text-neutral-500" />
}
