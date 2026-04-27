import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
        className
      )}
      {...props}
    />
  );
}
