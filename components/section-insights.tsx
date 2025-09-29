"use client"

import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import Link from "next/link"

const chatbotData = [
  { month: "SEP", resolved: 22, pending: 12 },
  { month: "OCT", resolved: 28, pending: 18 },
  { month: "NOV", resolved: 24, pending: 16 },
  { month: "DEC", resolved: 32, pending: 21 },
  { month: "JAN", resolved: 27, pending: 19 },
  { month: "FEB", resolved: 46, pending: 25 },
  { month: "MAR", resolved: 41, pending: 23 },
  { month: "APR", resolved: 44, pending: 28 },
]

export function SectionInsights() {
  return (
    <section aria-labelledby="insights-heading" className="relative">
      {/* Decorative background fade behind right cards */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60">
        <div className="h-full bg-[radial-gradient(60%_60%_at_60%_60%,color-mix(in_oklch,var(--color-primary)_10%,transparent),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 md:py-12">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          {/* Left: Copy + bullets */}
          <div>
            <h2
              id="insights-heading"
              className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
            >
              Transform Customer
              Support with
              Smart AI Chatbots

            </h2>
            <p className="mt-4 max-w-prose text-pretty text-muted-foreground leading-relaxed md:text-base">
              Deploy intelligent chatbots that understand context, learn from interactions,
              and provide instant, accurate responses to boost customer satisfaction.

            </p>

            <ul className="mt-6 grid gap-3 text-sm md:text-base">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-chart-2)]" aria-hidden="true" />
                <span className="text-foreground">
                  <span className="font-medium">24/7 Instant Response</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-chart-2)]" aria-hidden="true" />
                <span className="text-foreground">
                  <span className="font-medium">Multilingual Support</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-chart-2)]" aria-hidden="true" />
                <span className="text-foreground">
                  <span className="font-medium">Smart Learning & Analytics</span>
                </span>
              </li>
            </ul>

            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="#">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Right: Cards cluster */}
          <div className="relative">
            {/* Floating mini chart */}
            <div className="absolute -top-20 -right-8 z-10 hidden w-[320px] rounded-xl border bg-card/95 p-4 shadow-lg ring-1 ring-black/5 md:block">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Tickets Resolved</p>
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--color-chart-3)" }} />
                  <span>Resolved</span>
                  <div className="ml-3 h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--color-chart-2)" }} />
                  <span>Pending</span>
                </div>
              </div>

              <ChartContainer
                config={{
                  resolved: { label: "Resolved", color: "var(--color-chart-3)" },
                  pending: { label: "Pending", color: "var(--color-chart-2)" },
                }}
                className="aspect-[16/7] w-full"
              >
                <LineChart data={chatbotData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeOpacity={0.2} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                  <Line type="monotone" dataKey="resolved" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>

              {/* Value callout bubble */}
              <div className="pointer-events-none absolute right-10 top-16 rounded-lg bg-foreground px-2.5 py-1 text-xs font-semibold text-background shadow-md">
                46
              </div>
            </div>

            {/* Main Chatbot Performance card */}
            <div className="rounded-2xl border bg-card p-6 shadow-xl ring-1 ring-black/5">
              <p className="text-sm font-medium">Chatbot Performance</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight">98%</span>
                <span className="text-muted-foreground">Satisfaction</span>
              </div>

              {/* Stacked bar */}
              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[42%]" style={{ backgroundColor: "var(--color-chart-3)" }} />
                <div className="h-full w-[18%]" style={{ backgroundColor: "var(--color-chart-1)" }} />
                <div className="h-full w-[12%]" style={{ backgroundColor: "var(--color-chart-4)" }} />
                <div className="h-full w-[12%]" style={{ backgroundColor: "var(--color-chart-5)" }} />
                <div className="h-full w-[16%]" style={{ backgroundColor: "var(--color-chart-2)" }} />
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <LegendItem color="var(--color-chart-3)" label="Resolved Instantly" value="42%" />
                <LegendItem color="var(--color-chart-1)" label="Escalated to Human" value="18%" />
                <LegendItem color="var(--color-chart-4)" label="Follow-up Required" value="12%" />
                <LegendItem color="var(--color-chart-5)" label="Complex Queries" value="12%" />
                <LegendItem color="var(--color-chart-2)" label="Multi-language" value="16%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-block h-4 w-4 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="text-muted-foreground">
        {label} : <span className="text-foreground">{value}</span>
      </span>
    </div>
  )
}
