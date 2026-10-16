"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { readApiJson } from "@/lib/api";

type DemoCredentials = {
  username: string;
  password: string;
};

export function OperatorLoginForm({
  demoMode,
  demoCredentials
}: {
  demoMode: boolean;
  demoCredentials: DemoCredentials | null;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState(demoCredentials?.username ?? "");
  const [password, setPassword] = useState(demoCredentials?.password ?? "");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [demoLoginError, setDemoLoginError] = useState("");

  async function copyDemoCredential(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}. Select and copy it instead.`);
    }
  }

  async function loginWithDemoCredentials() {
    setDemoLoginError("");
    setVerifying(true);
    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await readApiJson<{ redirectTo?: string }>(response, "Demo login failed");
      setPassword("");
      toast.success("Demo operator signed in");
      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Demo login failed";
      setDemoLoginError(
        message.includes("Too many demo login attempts")
          ? `${message} The local limit resets when the development server restarts.`
          : message
      );
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  }

  async function requestOtp() {
    setSending(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "operator_login" })
      });
      await readApiJson(response, "Unable to send OTP");
      setOtpSent(true);
      toast.success("OTP sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send OTP");
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    setVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "operator_login", code })
      });
      const data = await readApiJson<{ redirectTo?: string }>(response, "Could not verify OTP");
      toast.success("Logged in successfully");
      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />
      <main className={`mx-auto px-6 py-12 ${demoMode ? "max-w-3xl" : "max-w-md"}`}>
        <div className="grid gap-6">
          {demoMode ? (
            <>
              <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xl sm:p-8">
                <p className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold tracking-wide text-blue-800">
                  DEMO MODE
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  🚀 TRY THE SAFETAG LIVE DEMO
                </h1>
                <p role="status" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium leading-relaxed text-blue-950">
                  DEMO MODE — This presentation uses fictional sample data. No real customer information is used.
                  OTP, Twilio, email notifications, and paid integrations are disabled.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo username</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <code className="break-all font-semibold text-slate-900">
                        {demoCredentials?.username ?? "Demo username is not configured"}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!demoCredentials}
                        onClick={() => demoCredentials && copyDemoCredential(demoCredentials.username, "Username")}
                        className="shrink-0"
                      >
                        Copy Username
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo password</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <code className="break-all font-semibold text-slate-900">
                        {demoCredentials?.password ?? "Demo display password is not configured"}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!demoCredentials}
                        onClick={() => demoCredentials && copyDemoCredential(demoCredentials.password, "Password")}
                        className="shrink-0"
                      >
                        Copy Password
                      </Button>
                    </div>
                  </div>
                </div>

                <ol className="mt-6 grid gap-x-8 gap-y-2 text-sm leading-relaxed text-slate-700 sm:grid-cols-2">
                  <li><strong>STEP 1:</strong> Enter the demo username shown below.</li>
                  <li><strong>STEP 2:</strong> Enter the demo password shown below.</li>
                  <li><strong>STEP 3:</strong> Click &quot;Sign in to Demo&quot;.</li>
                  <li><strong>STEP 4:</strong> Explore the sample dashboard.</li>
                  <li><strong>STEP 5:</strong> Register a sample deposit using fictional visitor details.</li>
                  <li><strong>STEP 6:</strong> Generate and view the QR receipt.</li>
                  <li><strong>STEP 7:</strong> Search for the deposit and verify the return.</li>
                </ol>

                <a
                  href="#demo-login-form"
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-center font-bold text-white shadow-lg transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Start Demo
                </a>
                {!demoCredentials ? (
                  <p role="alert" className="mt-4 text-sm font-medium text-red-700">
                    Demo display credentials are unavailable or do not match the configured login password.
                    Set DEMO_DISPLAY_PASSWORD to the same local demo password and restart the development server.
                  </p>
                ) : null}
              </section>

              <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xl sm:p-8">
                <h2 className="text-xl font-bold text-slate-900">Demo Guide</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  After signing in, explore the dashboard, then create a check-in with made-up visitor details and
                  select the sample items. SafeTag creates a deposit and QR receipt. Use the receipt token in Scan QR
                  to find the deposit, verify the return, and go back to the dashboard to see the updated status.
                </p>
              </section>
            </>
          ) : null}
          <Card id={demoMode ? "demo-login-form" : undefined} className="overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl font-bold text-slate-800">Operator login</CardTitle>
                {demoMode ? <Badge variant="secondary">DEMO MODE</Badge> : null}
              </div>
              <CardDescription>
                {demoMode
                  ? "Enter the presentation credentials shown above to continue."
                  : "Phone OTP only. Operators can access only their own venue records and live actions."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              {demoMode ? (
                <>
                  {demoLoginError ? (
                    <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950">
                      {demoLoginError}
                    </p>
                  ) : null}
                  <div className="grid gap-2">
                    <label htmlFor="demo-username" className="text-sm font-medium">Demo username</label>
                    <Input
                      id="demo-username"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="demo-password" className="text-sm font-medium">Demo password</label>
                    <Input
                      id="demo-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <Button
                    onClick={loginWithDemoCredentials}
                    disabled={verifying || !username || !password || !demoCredentials}
                    className="w-full"
                  >
                    {verifying ? <Spinner /> : null}
                    Sign in to Demo
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <label htmlFor="operator-phone" className="text-sm font-medium">Phone number</label>
                    <Input
                      id="operator-phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+919811110001"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={requestOtp} disabled={sending} className="w-full">
                      {sending ? <Spinner /> : null}
                      Send OTP
                    </Button>
                    <Badge variant={otpSent ? "success" : "secondary"}>
                      {otpSent ? "OTP sent" : "Awaiting phone"}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="operator-otp" className="text-sm font-medium">OTP code</label>
                    <Input
                      id="operator-otp"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Enter OTP"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={verifyCode}
                    variant="outline"
                    disabled={!otpSent || verifying}
                    className="w-full border-0 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
                  >
                    {verifying ? <Spinner /> : null}
                    Verify and continue
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
