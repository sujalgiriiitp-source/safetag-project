import { OperatorLoginForm } from "@/components/operator/login-form";
import { verifyDemoCredentials } from "@/lib/demo-auth";
import { isDemoMode } from "@/lib/demo-mode";

export default async function OperatorLoginPage() {
  const demoMode = isDemoMode();
  const username = process.env.DEMO_USERNAME?.trim();
  const password = process.env.DEMO_DISPLAY_PASSWORD;
  const demoCredentials =
    demoMode && username && password && (await verifyDemoCredentials(username, password))
      ? { username, password }
      : null;

  return <OperatorLoginForm demoMode={demoMode} demoCredentials={demoCredentials} />;
}
