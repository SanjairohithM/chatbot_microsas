import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { BrandStrip } from "@/components/brand-strip"
import { SectionInsights } from "@/components/section-insights"
import { SectionValues } from "@/components/section-values"
import { SectionBenefits } from "@/components/section-benefits"
import { SectionProcess } from "@/components/section-process"
import { SectionTestimonials } from "@/components/section-testimonials"
import { SectionResources } from "@/components/section-resources"
import { SectionCta } from "@/components/section-cta"
import { SectionFooter } from "@/components/section-footer"
import { SectionPricing } from "@/components/section-pricing"
import { ParticleBackground } from "@/components/particle-background"
import { ScrollAnimation } from "@/components/scroll-animation"

export default function Page() {
  return (
    <>
      <ParticleBackground />
      <SiteHeader />
      <main>
        <Hero />
        <ScrollAnimation animation="fadeIn" delay={200}>
          <SectionInsights />
        </ScrollAnimation>
        <ScrollAnimation animation="slideUp" delay={100}>
          <SectionValues />
        </ScrollAnimation>
        <ScrollAnimation animation="fadeIn" delay={300}>
          <SectionBenefits />
        </ScrollAnimation>
        <ScrollAnimation animation="slideInLeft" delay={200}>
          <SectionProcess />
        </ScrollAnimation>
        <ScrollAnimation animation="bounceIn" delay={400}>
          <SectionPricing />
        </ScrollAnimation>
        <ScrollAnimation animation="fadeIn" delay={200}>
          <SectionTestimonials />
        </ScrollAnimation>
        <ScrollAnimation animation="slideInRight" delay={300}>
          <SectionResources />
        </ScrollAnimation>
        <ScrollAnimation animation="scaleIn" delay={200}>
          <SectionCta />
        </ScrollAnimation>
        <ScrollAnimation animation="fadeIn" delay={100}>
          <BrandStrip />
        </ScrollAnimation>
        <ScrollAnimation animation="slideUp" delay={200}>
          <SectionFooter />
        </ScrollAnimation>
      </main>
    </>
  )
}
