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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-12xl px-4 py-5">
        <nav aria-label="Main" className="flex items-center">
          {/* Left: Brand */}
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            <Image
                src="/logo.png"   // path inside public folder
                alt="DUKO Logo"
                width={120}       // adjust size
                height={60}
                priority          // ensures fast load
            />
            <span className="sr-only">Go to homepage</span>
          </Link>

          {/* Center: Nav */}
          <ul className="hidden md:flex justify-center mx-auto gap-12 text-sm">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`transition-colors ${
                      isActive
                        ? "text-primary font-semibold pb-1"
                        : "text-gray-500 hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth ">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="#">Start free</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
