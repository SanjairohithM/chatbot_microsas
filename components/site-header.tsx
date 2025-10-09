"use client"
import Image from "next/image";
import Link from "next/link"
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/analytics", label: "Analytics" },
    { href: "/products", label: "Products" },
    { href: "/customers", label: "Customers" },
    { href: "/support", label: "Support" },
  ];
  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav aria-label="Main" className="flex items-center">
          {/* Left: Brand */}
          <Link href="/" className="font-semibold tracking-tight text-foreground hover:opacity-80 transition-all duration-300 hover:scale-105">
            <Image
                src="/logo.png"
                alt="DUKO Logo"
                width={120}
                height={60}
                priority
                className="animate-fade-in"
            />
            <span className="sr-only">Go to homepage</span>
          </Link>

          {/* Center: Nav */}
          <ul className="hidden md:flex justify-center mx-auto gap-8 text-sm">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative transition-all duration-300 hover:scale-105 ${
                      isActive
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={{ fontFamily: 'var(--font-accent)' }}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hover:bg-secondary/50 transition-all duration-300 hover:scale-105" style={{ fontFamily: 'var(--font-accent)' }}>
              <Link href="/auth">Sign in</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse-slow" style={{ fontFamily: 'var(--font-accent)' }}>
              <Link href="#">Start free</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
