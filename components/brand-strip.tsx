export function BrandStrip() {
  return (
    <section aria-label="Trusted by companies" className="border-t bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <p className="text-center text-sm text-muted-foreground">
          Trusted by over <span className="font-semibold text-foreground">100+</span> startups and freelance businesses
        </p>
        <ul className="mt-6 grid grid-cols-2 items-center justify-items-center gap-6 text-muted-foreground md:grid-cols-6">
          <li className="text-sm md:text-base">Basecube</li>
          <li className="text-sm md:text-base">Voltax</li>
          <li className="text-sm md:text-base">Vertigo</li>
          <li className="text-sm md:text-base">Ponta</li>
          <li className="text-sm md:text-base">Avenue</li>
          <li className="text-sm md:text-base">Chain</li>
        </ul>
      </div>
    </section>
  )
}
