import Link from "next/link";
import { Instagram, Linkedin, ShieldCheck, Twitter } from "lucide-react";

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/nearby", label: "Find Operators" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/whatsapp-demo", label: "Demo" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/about", label: "Blog" },
      { href: "/about#contact", label: "Contact" },
      { href: "/about#contact", label: "Careers" }
    ]
  },
  {
    title: "Legal",
    links: [
      { href: "/about", label: "Privacy Policy" },
      { href: "/about", label: "Terms of Service" },
      { href: "/about", label: "Refund Policy" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-black text-slate-900">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck className="size-5" />
            </span>
            SafeTag
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
            Hardware-free secure storage for temples, exam centers, parks, museums and more.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-700">Made with ❤️ in India 🇮🇳</p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-bold text-slate-900">{column.title}</h3>
            <div className="mt-4 grid gap-3">
              {column.links.map((link) => (
                <Link key={`${column.title}-${link.label}`} href={link.href} className="text-sm text-slate-500 transition-colors hover:text-blue-600">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 SafeTag | All rights reserved</p>
          <div className="flex gap-3">
            <a href="https://x.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-2 transition-colors hover:border-blue-300 hover:text-blue-600" aria-label="SafeTag on X">
              <Twitter className="size-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-2 transition-colors hover:border-blue-300 hover:text-blue-600" aria-label="SafeTag on LinkedIn">
              <Linkedin className="size-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-2 transition-colors hover:border-blue-300 hover:text-blue-600" aria-label="SafeTag on Instagram">
              <Instagram className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
