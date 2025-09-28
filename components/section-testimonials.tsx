"use client"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Testimonial = {
  quote: string
  detail: string
  author: { name: string; role: string; avatar?: string }
}

const items: Testimonial[] = [
  {
    quote: "Customers and interested parties engaged.",
    detail: "Inbound traffic recorded 90% all‑time high checkout rate within 3 months.",
    author: {
      name: "King Star",
      role: "— Gavin Wieske, Marketing Manager",
      avatar: "/placeholder-user.jpg",
    },
  },
  {
    quote: "We converted intent into lasting loyalty.",
    detail: "Email journeys lifted retention by 32% and reduced time‑to‑value across cohorts.",
    author: {
      name: "Ava Cooper",
      role: "— VP Growth, Northwind",
      avatar: "/placeholder-user.jpg",
    },
  },
  {
    quote: "Insights that actually drive action.",
    detail: "Dashboards surfaced the right moments to nudge, increasing upsell by 18%.",
    author: {
      name: "Mason Lee",
      role: "— Head of Product, Acme",
      avatar: "/placeholder-user.jpg",
    },
  },
]

export function SectionTestimonials() {
  return (
    <section className="py-24 md:py-28">
      <div className="container">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Testimonials</h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Sign up for Benchmark today to stay focused on the reason you’re using email marketing in the first place:
            bringing your vision to life.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <Carousel opts={{ loop: true, align: "center" }} className="px-10 md:px-16">
            <CarouselContent>
              {items.map((t, i) => (
                <CarouselItem key={i}>
                  <article className="rounded-2xl border bg-muted/30 p-6 shadow-sm md:p-10">
                    <div className="text-center space-y-6">
                      {/* Centered quote */}
                      <blockquote className="text-pretty text-2xl font-semibold leading-tight md:text-3xl">
                        <span className="align-top text-4xl leading-none text-primary">"</span>
                        {t.quote}
                        <span className="align-top text-4xl leading-none text-primary">"</span>
                      </blockquote>

                      {/* Centered details + author */}
                      <div className="space-y-5">
                        <p className="text-muted-foreground max-w-2xl mx-auto">{t.detail}</p>
                        <div className="flex items-center justify-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={t.author.avatar || "/placeholder.svg"} alt={`${t.author.name} avatar`} />
                            <AvatarFallback>{t.author.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="leading-tight text-center">
                            <div className="font-medium">{t.author.name}</div>
                            <div className="text-sm text-muted-foreground">{t.author.role}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Arrows positioned like the reference */}
            <CarouselPrevious
              className="hidden size-10 md:flex -left-6 md:-left-12 bg-primary/10 text-primary border-0 hover:bg-primary/15"
              variant="outline"
            />
            <CarouselNext
              className="hidden size-10 md:flex -right-6 md:-right-12 bg-primary text-primary-foreground border-0 hover:bg-primary/90"
              variant="outline"
            />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
