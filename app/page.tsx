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

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <SectionInsights />
        <SectionValues />
        <SectionBenefits />
        <SectionProcess />
        <SectionPricing />
        <SectionTestimonials />
        <SectionResources />
        <SectionCta />
        <BrandStrip />
        <SectionFooter />
      </main>
    </>
  )
}
