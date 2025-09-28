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
    category: "Analytics",
    read: "5 min read",
    title: "Maximizing Productivity with the Latest SaaS Solutions",
    excerpt: "In the ever‑evolving landscape of business and technology, staying ahead of the curve is crucial.",
    href: "#",
    imgAlt: "Laptop with dashboards and plants on work desk",
    // Use placeholder image per guidelines
    img: "/laptop-dashboard-on-desk.jpg",
  },
  {
    id: 2,
    category: "Business",
    read: "5 min read",
    title: "5 Ways SaaS Is Revolutionizing Business Operations",
    excerpt: "Gone are the days when you were tied to your desktop computer. SaaS solutions provide.",
    href: "#",
    imgAlt: "Team collaborating with colorful UI on screens",
    img: "/team-collaboration-ui-screens.jpg",
  },
  {
    id: 3,
    category: "Marketing",
    read: "5 min read",
    title: "Artificial Intelligence and Machine Learning Integration",
    excerpt: "With data breaches on the rise, cybersecurity and data privacy have become paramount concerns.",
    href: "#",
    imgAlt: "Person writing on glass board with sticky notes",
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
              Useful Resources
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Discover our useful resources and read articles on different categories
            </p>
          </div>

          <a
            href="#"
            className="mt-1 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Show more..
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
