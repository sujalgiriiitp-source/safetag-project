import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ className, label, ...props }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50">
      <input type="checkbox" className={cn("size-4 rounded border-slate-300 accent-[#2563EB]", className)} {...props} />
      <span className="font-medium">{label}</span>
    </label>
  );
}
