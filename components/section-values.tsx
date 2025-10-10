"use client"

import type { ElementType } from "react"
import { cn } from "@/lib/utils"
import { Heart, Mic, BarChart3, Bot, Workflow, Smile } from "lucide-react"
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
    title: "Emotion-Aware Support",
    description: "AI bots instantly adapt tone and style.Detects every customer emotion.Adjusts tone automatically before issues escalate.",
    icon: Heart,
    featured: true,
    className: "md:col-span-2",
    animationDirection: "forward",
  },
  {
    title: "Multimodal Interaction",
    description: "Go beyond text. AI seamlessly handlesvoice queries, can send images, and respond with the right medium every time.",
    icon: Mic,
    className: "md:col-span-1",
    animationDirection: "reverse",
  },
  {
    title: "Analytics Dashboard",
    description: "From data to decisions. Visualize performance .Emotion heatmaps, resolution metrics, and knowledge gapsacross every language and channel.",
    icon: BarChart3,
    className: "md:col-span-1",
    animationDirection: "forward",
  },
  {
    title: "AI Quality Control",
    description: "Ensure every response stays sharp Detect errors instantly and let AI optimizes itself for peak performance.",
    icon: Bot,
    className: "md:col-span-2",
    animationDirection: "reverse",
  },
]

export function SectionValues() {
  return (
    <section id="values" aria-labelledby="values-heading" className="relative sm:py-5">
      <div className="container mx-auto px-4">
        <header className="text-center">
          <h2 id="values-heading" className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance" style={{ fontFamily: 'var(--font-heading)' }}>
          What makes the best AI Chatbot?
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
