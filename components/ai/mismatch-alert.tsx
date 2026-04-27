import { AlertTriangle } from "lucide-react";

export function MismatchAlert({
  declaredItems,
  detectedItems
}: {
  declaredItems: string[];
  detectedItems: string[];
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5" />
        <div className="space-y-2">
          <p className="font-semibold">Item mismatch detected. Please verify manually before returning.</p>
          <p>Declared: {declaredItems.join(", ") || "None"}</p>
          <p>Photo shows: {detectedItems.join(", ") || "No confirmed items detected"}</p>
        </div>
      </div>
    </div>
  );
}
