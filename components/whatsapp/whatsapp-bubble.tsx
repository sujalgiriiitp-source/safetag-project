import { cn } from "@/lib/utils";

export function WhatsAppBubble({
  title,
  body,
  time,
  className,
  shellClassName
}: {
  title?: string;
  body: string;
  time: string;
  className?: string;
  shellClassName?: string;
}) {
  const lines = body.split("\n");

  return (
    <div className={cn("rounded-2xl bg-slate-50 p-4", shellClassName)}>
      <div className={cn("max-w-md rounded-[24px] bg-[#DCF8C6] p-4 text-sm text-slate-800 shadow-sm", className)}>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-2 space-y-1" : "space-y-1"}>
          {lines.map((line, index) =>
            line ? (
              <p key={`${line}-${index}`} className="leading-relaxed">
                {line}
              </p>
            ) : (
              <div key={`spacer-${index}`} className="h-2" aria-hidden="true" />
            )
          )}
        </div>
        <p className="mt-3 text-right text-xs text-slate-500">✓✓ {time}</p>
      </div>
    </div>
  );
}
