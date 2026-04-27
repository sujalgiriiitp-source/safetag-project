import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
