import Link from "next/link";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CollectHelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">How collection works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>1. Open your QR receipt or the short SafeTag link.</p>
            <p>2. Show the QR to the venue operator at the collection counter.</p>
            <p>3. Operator verifies declared items against the stored proof photo.</p>
            <p>4. Once verified, the operator marks the token as returned.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href="/register">Register your venue</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/search">Manual search fallback</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
