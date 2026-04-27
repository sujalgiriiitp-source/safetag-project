import Link from "next/link";
import { ReactNode } from "react";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const internalLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/checkin", label: "New Check-in" },
  { href: "/dashboard/scan", label: "Scan QR" },
  { href: "/dashboard/search", label: "Manual Search" },
  { href: "/dashboard/items", label: "All Items" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/whatsapp-demo", label: "WA Demo" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/superadmin", label: "Super Admin" }
];

export function DashboardShell({
  title,
  description,
  children,
  actions,
  activeHref
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  activeHref?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                SafeTag Workspace
              </p>
              <h1 className="mt-3 text-2xl font-bold text-slate-800">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
            </div>
            {actions ?? (
              <Button asChild>
                <Link href="/dashboard/scan">Scan QR</Link>
              </Button>
            )}
          </div>

          <div className="-mx-6 sticky top-16 z-10 flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-6 pb-0 shadow-sm">
            {internalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-all",
                  activeHref === link.href
                    ? "border-blue-600 text-blue-600"
                    : "text-slate-500 hover:border-slate-300 hover:text-slate-800"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
