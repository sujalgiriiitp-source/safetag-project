import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
