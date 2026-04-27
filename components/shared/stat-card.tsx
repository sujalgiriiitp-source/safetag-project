import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
  valueClassName,
  labelClassName
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className={labelClassName ?? "text-xs font-semibold uppercase tracking-wide text-slate-500"}>{label}</p>
          <p className={valueClassName ?? "mt-3 text-3xl font-bold text-slate-800"}>{value}</p>
          {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
