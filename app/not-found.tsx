import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl rounded-3xl border bg-card p-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          Yeh page available nahi hai. SafeTag ka home ya visitor flow try karein.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Register venue</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
