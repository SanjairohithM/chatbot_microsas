import type React from "react"
import Link from "next/link"

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full glass-effect border border-border/50 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary hover:scale-110 hover:shadow-lg"
    >
      {children}
    </a>
  )
}

function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.75-.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
    </svg>
  )
}

function IconLinkedIn(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.5 8.5h4.9V24H.5V8.5Zm8.24 0h4.7v2.1h.07c.66-1.25 2.27-2.56 4.68-2.56 5 0 5.92 3.29 5.92 7.56V24h-4.9v-6.58c0-1.57-.03-3.6-2.19-3.6-2.19 0-2.52 1.71-2.52 3.49V24H8.74V8.5Z" />
    </svg>
  )
}

function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13 24v-9h3.1l.6-3.5H13V9.1c0-1 .33-1.7 1.94-1.7H17V4.2c-.34 0-1.56-.15-2.98-.15C11.04 4.05 9 5.86 9 8.7V11.5H6v3.5h3V24h4Z" />
    </svg>
  )
}

function IconTwitter(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M24 4.6a10 10 0 0 1-2.83.78 4.93 4.93 0 0 0 2.16-2.7 9.86 9.86 0 0 1-3.12 1.19 4.93 4.93 0 0 0-8.4 4.49A14 14 0 0 1 1.67 3.15a4.93 4.93 0 0 0 1.53 6.58 4.86 4.86 0 0 1-2.23-.61v.06a4.93 4.93 0 0 0 3.95 4.83 4.98 4.98 0 0 1-1.29.17c-.32 0-.63-.03-.93-.08a4.94 4.94 0 0 0 4.6 3.43A9.89 9.89 0 0 1 0 20.53 13.93 13.93 0 0 0 7.55 22c9.05 0 14-7.5 14-14l-.02-.64A9.9 9.9 0 0 0 24 4.6Z" />
    </svg>
  )
}

export function SectionFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative border-t border-border/50 bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background"></div>
      <div className="absolute inset-0 hero-grid opacity-5"></div>
      
      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tracking-tight gradient-text">Convox</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The future of AI-powered customer support. Build intelligent chatbots that understand, engage, and delight your customers.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="#" label="Instagram">
                <IconInstagram className="h-5 w-5" />
              </SocialLink>
              <SocialLink href="#" label="LinkedIn">
                <IconLinkedIn className="h-5 w-5" />
              </SocialLink>
              <SocialLink href="#" label="Facebook">
                <IconFacebook className="h-5 w-5" />
              </SocialLink>
              <SocialLink href="#" label="Twitter">
                <IconTwitter className="h-5 w-5" />
              </SocialLink>
            </div>
          </div>

          {/* Product */}
          <nav aria-label="Product" className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Product</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  Changelog
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company" className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Company</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  Press Kit
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Support</h3>
            <div className="space-y-3 text-muted-foreground">
              <p className="mb-4">
                <span className="text-primary font-semibold">+1 (555) 123-4567</span>
              </p>
              <a 
                className="block hover:text-primary transition-colors duration-300" 
                href="mailto:hello@convox.ai"
              >
                hello@convox.ai
              </a>
              <div className="space-y-2">
                <Link href="#" className="block hover:text-primary transition-colors duration-300">
                  Help Center
                </Link>
                <Link href="#" className="block hover:text-primary transition-colors duration-300">
                  Community
                </Link>
                <Link href="#" className="block hover:text-primary transition-colors duration-300">
                  Status Page
                </Link>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/30" />

        <div className="flex flex-col items-start justify-between gap-6 text-muted-foreground md:flex-row md:items-center">
          <p className="text-sm">
            © Copyright {year} <span className="font-semibold text-foreground">Convox.ai</span> All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-sm">
            <Link href="#" className="hover:text-primary transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors duration-300">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-primary transition-colors duration-300">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SectionFooter
