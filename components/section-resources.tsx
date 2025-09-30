import { ArrowRight } from "lucide-react"

type Resource = {
  id: number
  category: string
  read: string
  title: string
  excerpt: string
  href: string
  imgAlt: string
  img: string
}

const resources: Resource[] = [
  {
    id: 1,
    category: "24/7 Support",
    read: "Always Available",
    title: "Never Miss a Lead Again",
    excerpt: "AI bots work around the clock, engaging visitors even after business hours. Every inquiry is answered instantly, turning missed opportunities into qualified leads.",
    href: "#",
    imgAlt: "AI chatbot working 24/7 on laptop screen",
    img: "/laptop-dashboard-on-desk.jpg",
  },
  {
    id: 2,
    category: "Cost Savings",
    read: "Automated Support",
    title: "Cut Support Costs, Not Quality",
    excerpt: "Handle FAQs, order updates automatically. Free up your team for complex, high-value tasks without sacrificing response speed or accuracy.",
    href: "#",
    imgAlt: "Team collaborating with AI chatbot interface",
    img: "/team-collaboration-ui-screens.jpg",
  },
  {
    id: 3,
    category: "Scalability",
    read: "Growth Ready",
    title: "Scale Engagement As You Grow",
    excerpt: "Transform your website into a dynamic, conversational experience with multilingual, emotion-aware support that scales effortlessly as your business expands.",
    href: "#",
    imgAlt: "Planning board with AI chatbot growth strategy",
    img: "/sticky-notes-planning-board.jpg",
  },
]

export function SectionResources() {
  return (
    <section aria-labelledby="useful-resources" className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h2 id="useful-resources" className="text-pretty text-3xl font-semibold tracking-tight md:text-4xl">
              Why Choose Our AI Chatbot
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Discover the key benefits that make our AI chatbot the perfect solution for your business
            </p>
          </div>

          <a
            href="#"
            className="mt-1 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Learn more..
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((post) => (
            <article
              key={post.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-[16/7] w-full overflow-hidden bg-muted">
                {/* Decorative image per design; alt kept for accessibility */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.img || "/placeholder.svg"} alt={post.imgAlt} className="h-full w-full object-cover" />
              </div>

              <div className="space-y-4 p-5 md:p-6">
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
                    {post.category}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">{post.read}</span>
                </div>

                <h3 className="text-pretty text-lg font-semibold leading-snug md:text-xl">{post.title}</h3>

                <p className="text-sm text-muted-foreground">{post.excerpt}</p>

                <div className="pt-1">
                  <a
                    href={post.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    aria-label={`Read more: ${post.title}`}
                  >
                    Read more
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SectionResources
