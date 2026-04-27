"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/nearby", label: "Find Operators" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" }
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-16 border-b border-transparent bg-white/90 transition-all",
        scrolled ? "border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl" : "bg-white"
      )}
    >
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
              className={cn(
                "text-sm font-medium text-slate-600 transition-colors hover:text-blue-700",
                pathname === link.href ? "text-slate-950" : ""
              )}
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
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="ml-auto h-full w-[82vw] max-w-sm bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 font-bold text-slate-950" onClick={() => setOpen(false)}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <ShieldCheck className="size-5" />
                </span>
                SafeTag
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-8 grid gap-2">
              {[...publicLinks, { href: "/login", label: "Operator Login" }, { href: "/dashboard", label: "Dashboard" }].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              <Button asChild variant="outline">
                <Link href="/register" onClick={() => setOpen(false)}>For Venues</Link>
              </Button>
              <Button asChild>
                <Link href="/register" onClick={() => setOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
