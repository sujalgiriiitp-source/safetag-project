import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-3", align === "center" && "items-center text-center")}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{eyebrow}</p>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-4xl">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}
