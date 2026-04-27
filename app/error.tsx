"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl rounded-3xl border bg-card p-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-warning">
          SafeTag Error
        </p>
        <h1 className="mt-4 text-3xl font-semibold">500 | Something broke unexpectedly</h1>
        <p className="mt-3 text-muted-foreground">
          Hum is issue ko handle kar rahe hain. Try again, or go back to the dashboard and continue.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
