import Link from "next/link";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Authentication info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              SafeTag mein visitor ko login nahi karna padta. OTP sirf venue registration aur operator login ke liye use hota hai.
            </p>
            <p className="text-muted-foreground">
              Demo mode uses OTP <span className="font-semibold text-primary">123456</span> if Twilio Verify
              is not configured yet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">Open operator login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
