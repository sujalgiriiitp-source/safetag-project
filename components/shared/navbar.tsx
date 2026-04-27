import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/nearby", label: "Find Operators" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-3 font-bold text-slate-950">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="size-5" />
          </span>
          <span className="text-lg text-slate-950">SafeTag</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/register">For Venues</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">Get Started</Link>
          </Button>

          <details className="group relative md:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-slate-700 marker:hidden">
              <Menu className="size-5" />
            </summary>
            <div className="absolute right-0 top-12 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
              <nav className="grid gap-1">
                {[...publicLinks, { href: "/login", label: "Operator Login" }, { href: "/dashboard", label: "Dashboard" }].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 grid gap-3">
                <Button asChild variant="outline">
                  <Link href="/register">For Venues</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
